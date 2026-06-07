import { Cate } from '@/types/app/cate';

export type CateDropZone = 'before' | 'after' | 'inside';

export type CateSelectOption = {
  value: number;
  label: string;
  children?: CateSelectOption[];
};

export type SiblingContext = {
  parentLevel: number;
  siblings: Cate[];
  index: number;
};

export function sortSiblings(items: Cate[]): Cate[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function sortCateTree(items: Cate[]): Cate[] {
  return sortSiblings(items).map((item) => ({
    ...item,
    children: item.children?.length ? sortCateTree(item.children) : item.children,
  }));
}

export function collectKeys(items: Cate[]): number[] {
  return items.flatMap((item) => [
    item.id || 0,
    ...(item.children?.length ? collectKeys(item.children) : []),
  ]);
}

export function findSiblingContext(
  tree: Cate[],
  key: number,
  parentLevel = 0,
): SiblingContext | null {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === key) {
      return { parentLevel, siblings: tree, index: i };
    }
    if (tree[i].children?.length) {
      const found = findSiblingContext(tree[i].children!, key, tree[i].id!);
      if (found) return found;
    }
  }
  return null;
}

export function findCateById(tree: Cate[], id: number): Cate | null {
  for (const item of tree) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findCateById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function isNodeOrDescendant(node: Cate, targetId: number): boolean {
  if (node.id === targetId) return true;
  return node.children?.some((child) => isNodeOrDescendant(child, targetId)) ?? false;
}

export function replaceSiblings(tree: Cate[], parentLevel: number, newSiblings: Cate[]): Cate[] {
  const withOrder = newSiblings.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
  if (parentLevel === 0) {
    return withOrder.map((item) => ({
      ...item,
      children: item.children?.length ? sortCateTree(item.children) : item.children,
    }));
  }
  return tree.map((node) => ({
    ...node,
    children:
      node.id === parentLevel
        ? withOrder
        : node.children?.length
          ? replaceSiblings(node.children, parentLevel, newSiblings)
          : node.children,
  }));
}

export function removeNodeFromTree(
  tree: Cate[],
  id: number,
): { tree: Cate[]; removed: Cate | null } {
  let removed: Cate | null = null;
  const filtered = tree.filter((item) => {
    if (item.id === id) {
      removed = item;
      return false;
    }
    return true;
  });
  if (removed) return { tree: filtered, removed };

  return {
    tree: tree.map((node) => {
      if (!node.children?.length) return node;
      const { tree: children, removed: childRemoved } = removeNodeFromTree(node.children, id);
      if (childRemoved) {
        removed = childRemoved;
        return { ...node, children };
      }
      return node;
    }),
    removed,
  };
}

export function insertAtParent(
  tree: Cate[],
  parentId: number,
  index: number,
  node: Cate,
): Cate[] {
  const withLevel = { ...node, level: parentId };
  if (parentId === 0) {
    const next = [...tree];
    next.splice(index, 0, withLevel);
    return next.map((item, i) => ({ ...item, order: i + 1 }));
  }
  return tree.map((item) => {
    if (item.id === parentId) {
      const children = [...(item.children ?? [])];
      children.splice(index, 0, withLevel);
      return {
        ...item,
        children: children.map((child, i) => ({ ...child, order: i + 1 })),
      };
    }
    if (item.children?.length) {
      return { ...item, children: insertAtParent(item.children, parentId, index, node) };
    }
    return item;
  });
}

function calcGapInsertIndex(
  dropIndex: number,
  after: boolean,
  dragIndex: number,
  sameParent: boolean,
): number {
  let insertIndex = dropIndex + (after ? 1 : 0);
  if (sameParent && dragIndex < insertIndex) insertIndex -= 1;
  return insertIndex;
}

export function getSiblingsByParentId(tree: Cate[], parentId: number): Cate[] {
  if (parentId === 0) return tree;
  const stack = [...tree];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === parentId) return node.children ?? [];
    if (node.children?.length) stack.push(...node.children);
  }
  return [];
}

export type ApplyDropSort = {
  kind: 'sort';
  nextList: Cate[];
  parentLevel: number;
  ids: number[];
  movedId: number;
};

export type ApplyDropMove = {
  kind: 'move';
  nextList: Cate[];
  dragItem: Cate;
  newLevel: number;
  oldParentLevel: number;
  oldSiblingIds: number[];
  newParentLevel: number;
  newSiblingIds: number[];
  expandParentId?: number;
};

export type ApplyDropResult = ApplyDropSort | ApplyDropMove;

export function applyCateDrop(
  list: Cate[],
  dragId: number,
  targetId: number,
  zone: CateDropZone,
): ApplyDropResult | null {
  if (dragId === targetId) return null;

  const dragCtx = findSiblingContext(list, dragId);
  if (!dragCtx) return null;

  const dragItem = dragCtx.siblings[dragCtx.index];

  if (zone === 'inside') {
    if (isNodeOrDescendant(dragItem, targetId)) return null;

    const { tree: treeWithoutDrag, removed } = removeNodeFromTree(list, dragId);
    if (!removed) return null;

    const insertIndex = getSiblingsByParentId(treeWithoutDrag, targetId).length;
    const nextList = insertAtParent(treeWithoutDrag, targetId, insertIndex, removed);

    const oldSiblingIds = dragCtx.siblings
      .filter((item) => item.id !== dragId)
      .map((item) => item.id!);
    const newSiblingIds = getSiblingsByParentId(nextList, targetId).map((item) => item.id!);

    return {
      kind: 'move',
      nextList,
      dragItem: removed,
      newLevel: targetId,
      oldParentLevel: dragCtx.parentLevel,
      oldSiblingIds,
      newParentLevel: targetId,
      newSiblingIds,
      expandParentId: targetId,
    };
  }

  const dropCtx = findSiblingContext(list, targetId);
  if (!dropCtx) return null;

  const after = zone === 'after';
  const sameParent = dragCtx.parentLevel === dropCtx.parentLevel;

  if (sameParent) {
    const siblings = [...dragCtx.siblings];
    const [removed] = siblings.splice(dragCtx.index, 1);
    const insertIndex = calcGapInsertIndex(dropCtx.index, after, dragCtx.index, true);
    siblings.splice(insertIndex, 0, removed);

    const parentLevel = dragCtx.parentLevel;
    const ids = siblings.map((item) => item.id!);
    const nextList = replaceSiblings(list, parentLevel, siblings);

    return { kind: 'sort', nextList, parentLevel, ids, movedId: dragId };
  }

  const { tree: treeWithoutDrag, removed } = removeNodeFromTree(list, dragId);
  if (!removed) return null;

  const dropCtxAfter = findSiblingContext(treeWithoutDrag, targetId);
  if (!dropCtxAfter) return null;

  const insertIndex = calcGapInsertIndex(dropCtxAfter.index, after, -1, false);
  const newParentLevel = dropCtxAfter.parentLevel;
  const nextList = insertAtParent(treeWithoutDrag, newParentLevel, insertIndex, removed);

  const oldSiblingIds = dragCtx.siblings
    .filter((item) => item.id !== dragId)
    .map((item) => item.id!);
  const newSiblingIds = getSiblingsByParentId(nextList, newParentLevel).map((item) => item.id!);

  return {
    kind: 'move',
    nextList,
    dragItem: removed,
    newLevel: newParentLevel,
    oldParentLevel: dragCtx.parentLevel,
    oldSiblingIds,
    newParentLevel,
    newSiblingIds,
    expandParentId: newParentLevel || undefined,
  };
}

export function filterCates(items: Cate[], keyword: string): Cate[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return items;

  return items.reduce<Cate[]>((acc, item) => {
    const filteredChildren = item.children?.length ? filterCates(item.children, kw) : [];
    const match =
      item.name?.toLowerCase().includes(kw) || item.mark?.toLowerCase().includes(kw);

    if (!match && !filteredChildren.length) return acc;

    const next: Cate = { ...item };
    if (filteredChildren.length) {
      next.children = filteredChildren;
    } else if (!match) {
      next.children = [];
    }
    acc.push(next);
    return acc;
  }, []);
}

/** 将分类树转为 Select 级联 options；编辑时可排除当前节点及其子树 */
export function buildCateSelectOptions(
  data: Cate[],
  isRoot = true,
  excludeId?: number,
): CateSelectOption[] {
  const options: CateSelectOption[] = isRoot ? [{ value: 0, label: '一级分类' }] : [];

  for (const item of data) {
    if (excludeId != null && item.id === excludeId) continue;

    const children = item.children?.length
      ? buildCateSelectOptions(item.children, false, excludeId)
      : undefined;

    options.push({
      value: item.id!,
      label: item.name,
      ...(children?.length ? { children } : {}),
    });
  }

  return options;
}
