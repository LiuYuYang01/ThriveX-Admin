import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { HolderOutlined } from '@ant-design/icons';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

import { Cate } from '@/types/app/cate';
import {
  type CateDropZone,
  findCateById,
  isNodeOrDescendant,
} from './treeUtils';

export type CateDropPayload = {
  dragId: number;
  targetId: number;
  zone: CateDropZone;
};

const ZONE_BEFORE_RATIO = 0.28;
const ZONE_AFTER_RATIO = 0.72;

type DropTarget = { id: number; zone: CateDropZone };

function getDropZoneFromPoint(clientY: number, rowEl: HTMLElement): CateDropZone {
  const { top, height } = rowEl.getBoundingClientRect();
  const ratio = (clientY - top) / Math.max(height, 1);
  if (ratio < ZONE_BEFORE_RATIO) return 'before';
  if (ratio > ZONE_AFTER_RATIO) return 'after';
  return 'inside';
}

function CateTreeNodeDot({ type }: { type: string }) {
  const dotClass =
    type === 'nav'
      ? 'bg-amber-400/70'
      : type === 'page'
        ? 'bg-sky-400/70'
        : 'bg-primary/45';
  return (
    <span
      className={`mt-0.5 size-2 shrink-0 rounded-full ${dotClass}`}
      aria-hidden
    />
  );
}

type CateTreeProps = {
  items: Cate[];
  expandedKeys: number[];
  onExpandedKeysChange: (keys: number[]) => void;
  selectedId?: number;
  highlightId?: number | null;
  draggable: boolean;
  saving?: boolean;
  onDrop: (payload: CateDropPayload) => void;
  renderActions: (item: Cate) => ReactNode;
  renderExtra?: (item: Cate) => ReactNode;
};

export default function CateTree({
  items,
  expandedKeys,
  onExpandedKeysChange,
  selectedId,
  highlightId,
  draggable,
  saving,
  onDrop,
  renderActions,
  renderExtra,
}: CateTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<number | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerCleanupRef = useRef<(() => void) | null>(null);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingItem, setDraggingItem] = useState<Cate | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  const expandedSet = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  const clearDragState = useCallback(() => {
    pointerCleanupRef.current?.();
    pointerCleanupRef.current = null;
    dragIdRef.current = null;
    dropTargetRef.current = null;
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    setDraggingId(null);
    setDraggingItem(null);
    setDropTarget(null);
    setPointerPos(null);
  }, []);

  const toggleExpand = useCallback(
    (id: number) => {
      onExpandedKeysChange(
        expandedSet.has(id)
          ? expandedKeys.filter((k) => k !== id)
          : [...expandedKeys, id],
      );
    },
    [expandedKeys, expandedSet, onExpandedKeysChange],
  );

  const resolveDropTarget = useCallback(
    (clientX: number, clientY: number, dragId: number, list: Cate[]): DropTarget | null => {
      const el = document.elementFromPoint(clientX, clientY);
      const row = el?.closest('[data-cate-row]') as HTMLElement | null;
      if (!row || !treeRef.current?.contains(row)) return null;

      const targetId = Number(row.dataset.cateId);
      if (Number.isNaN(targetId) || targetId === dragId) return null;

      const dragItem = findCateById(list, dragId);
      if (!dragItem) return null;

      let zone = getDropZoneFromPoint(clientY, row);
      if (zone === 'inside' && isNodeOrDescendant(dragItem, targetId)) {
        zone = clientY < row.getBoundingClientRect().top + row.offsetHeight / 2 ? 'before' : 'after';
      }

      return { id: targetId, zone };
    },
    [],
  );

  const updateDropTarget = useCallback(
    (clientX: number, clientY: number, list: Cate[]) => {
      setPointerPos({ x: clientX, y: clientY });
      const dragId = dragIdRef.current;
      if (dragId == null) return;

      const next = resolveDropTarget(clientX, clientY, dragId, list);
      dropTargetRef.current = next;
      setDropTarget(next);

      if (next) {
        const target = findCateById(list, next.id);
        if (
          next.zone === 'inside' &&
          target?.children?.length &&
          !expandedSet.has(next.id)
        ) {
          if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
          expandTimerRef.current = setTimeout(() => {
            onExpandedKeysChange([...new Set([...expandedKeys, next.id])]);
          }, 420);
        }
      } else if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
      }
    },
    [expandedKeys, expandedSet, onExpandedKeysChange, resolveDropTarget],
  );

  const startPointerDrag = useCallback(
    (e: React.PointerEvent, item: Cate, list: Cate[]) => {
      if (!draggable || saving || e.button !== 0 || !item.id) return;
      e.preventDefault();
      e.stopPropagation();

      const handle = e.currentTarget as HTMLElement;
      handle.setPointerCapture(e.pointerId);

      dragIdRef.current = item.id;
      setDraggingId(item.id);
      setDraggingItem(item);
      setDropTarget(null);
      dropTargetRef.current = null;
      setPointerPos({ x: e.clientX, y: e.clientY });

      const onPointerMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        updateDropTarget(ev.clientX, ev.clientY, list);
      };

      const finish = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        cleanup();
        try {
          handle.releasePointerCapture(ev.pointerId);
        } catch {
          /* released */
        }

        const target = dropTargetRef.current;
        const dragId = dragIdRef.current;
        if (target && dragId != null) {
          const drag = findCateById(list, dragId);
          const dropNode = findCateById(list, target.id);
          if (
            drag &&
            dropNode &&
            !(target.zone === 'inside' && isNodeOrDescendant(drag, target.id))
          ) {
            onDrop({ dragId, targetId: target.id, zone: target.zone });
          }
        }
        clearDragState();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', finish);
        document.removeEventListener('pointercancel', finish);
        pointerCleanupRef.current = null;
      };

      pointerCleanupRef.current = cleanup;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', finish);
      document.addEventListener('pointercancel', finish);
    },
    [clearDragState, draggable, onDrop, saving, updateDropTarget],
  );

  useEffect(() => {
    if (draggingId == null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') clearDragState();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearDragState, draggingId]);

  useEffect(
    () => () => {
      clearDragState();
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    },
    [clearDragState],
  );

  const renderNodes = (nodes: Cate[], depth: number) => (
    <ul className={depth === 0 ? 'space-y-0.5' : 'mt-0.5 space-y-0.5'} role="tree">
      {nodes.map((item) => {
        const id = item.id!;
        const hasChildren = Boolean(item.children?.length);
        const expanded = expandedSet.has(id);
        const isDragging = draggingId === id;
        const isDropTarget = dropTarget?.id === id;
        const dropZone = isDropTarget ? dropTarget.zone : null;
        const isHighlighted = highlightId === id;
        const isSelected = selectedId === id;

        const rowRing =
          isHighlighted
            ? 'ring-2 ring-primary/35 bg-primary/8 dark:bg-primary/12'
            : isSelected
              ? 'border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
              : dropZone === 'inside' && isDropTarget
                ? 'border-primary/40 bg-primary/8 dark:bg-primary/12'
                : 'border-transparent';

        return (
          <li key={id} role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
            {dropZone === 'before' && isDropTarget ? (
              <div
                className="mx-1.5 mb-0.5 h-0.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/40"
                aria-hidden
              />
            ) : (
              <div className="h-px" aria-hidden />
            )}

            <div
              data-cate-row
              data-cate-id={id}
              className={`group relative rounded-lg border transition-[opacity,box-shadow,background-color,border-color] duration-150 hover:border-slate-200/80 hover:bg-slate-50/90 dark:hover:border-strokedark dark:hover:bg-white/5 ${rowRing} ${isDragging ? 'opacity-35' : ''}`}
              style={{ marginLeft: depth * 20 }}
            >
              <div
                className={`flex items-center justify-between gap-2 px-1.5 ${depth > 0 ? 'py-1' : 'py-1.5'}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(id)}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"
                      aria-label={expanded ? '收起' : '展开'}
                    >
                      {expanded ? (
                        <FiChevronDown className="text-primary" size={14} />
                      ) : (
                        <FiChevronRight size={14} />
                      )}
                    </button>
                  ) : (
                    <span className="inline-block w-7 shrink-0" aria-hidden />
                  )}

                  {draggable ? (
                    <button
                      type="button"
                      onPointerDown={(e) => startPointerDrag(e, item, items)}
                      className={`flex size-7 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary active:cursor-grabbing dark:hover:bg-white/10 ${isDragging ? 'cursor-grabbing text-primary' : ''}`}
                      aria-label={`拖动 ${item.name}`}
                    >
                      <HolderOutlined />
                    </button>
                  ) : (
                    <span className="w-7 shrink-0" aria-hidden />
                  )}

                  <CateTreeNodeDot type={item.type} />

                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span
                      className={`min-w-0 truncate font-medium text-slate-700 dark:text-slate-200 ${depth > 0 ? 'text-[13px]' : 'text-sm'}`}
                    >
                      {item.name}
                      {item.type === 'cate' && item.count != null && (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-200">
                          （{item.count}）
                        </span>
                      )}
                    </span>
                  </div>

                  {renderExtra?.(item)}
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {renderActions(item)}
                </div>
              </div>
            </div>

            {dropZone === 'after' && isDropTarget ? (
              <div
                className="mx-1.5 mt-0.5 h-0.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/40"
                aria-hidden
              />
            ) : (
              <div className="h-px" aria-hidden />
            )}

            {hasChildren && expanded ? (
              <div className="border-l border-slate-200/80 pl-2 dark:border-strokedark">
                {renderNodes(item.children!, depth + 1)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      ref={treeRef}
      className={`relative ${draggingId != null ? 'select-none' : ''} ${saving ? 'pointer-events-none opacity-60' : ''}`}
    >
      {renderNodes(items, 0)}

      {draggingItem && pointerPos ? (
        <div
          className="pointer-events-none fixed z-1000 flex max-w-[min(260px,calc(100vw-24px))] items-center gap-2 rounded-xl border border-primary/25 bg-white/95 px-3 py-2 shadow-lg shadow-primary/10 backdrop-blur-sm dark:border-primary/30 dark:bg-boxdark/95"
          style={{
            left: Math.min(pointerPos.x + 12, window.innerWidth - 280),
            top: pointerPos.y - 24,
          }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HolderOutlined />
          </span>
          <span className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {draggingItem.name}
          </span>
        </div>
      ) : null}
    </div>
  );
}
