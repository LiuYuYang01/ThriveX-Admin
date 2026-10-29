import { Drawer } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface Props {
  title: string;
  loading?: boolean;
  open?: boolean;
  onClose?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}

export default ({ title, children, open, onClose, loading, className }: Props) => {
  const Title = () => {
    return (
      <div className="flex justify-between items-center">
        <div></div>
        <div className="ml-6">{title}</div>
        <div
          onClick={() => onClose?.(false)}
          className="group p-3 px-6 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
        >
          <CloseOutlined className="group-hover:scale-150 transition-transform" />
        </div>
      </div>
    );
  };

  return (
    <Drawer
      loading={loading}
      title={<Title />}
      open={open}
      onClose={() => onClose?.(false)}
      // 从底部升起，留出顶部一条遮罩，点外面才关得掉
      size="92vh"
      placement="bottom"
      closeIcon={null}
      className={`[&>.ant-drawer-header]:p-0! ${className}`}
    >
      {children}
    </Drawer>
  );
};
