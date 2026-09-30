type TreeItem = {
  id?: number;
  commentId?: number;
  createTime: number;
  children?: TreeItem[];
};

export function normalizeCommentTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.map((item) => {
    const children = item.children?.length ? normalizeCommentTree(item.children) : undefined;
    return { ...item, children };
  });
}

export function buildCommentTree<T extends TreeItem>(items: T[], parentId = 0): T[] {
  return items
    .filter((item) => (item.commentId ?? 0) === parentId)
    .map((item) => {
      const children = buildCommentTree(items, item.id!);
      return {
        ...item,
        children: children.length > 0 ? children : undefined,
      };
    })
    .sort((a, b) => {
      if (parentId === 0) return +b.createTime - +a.createTime;
      return +a.createTime - +b.createTime;
    });
}
