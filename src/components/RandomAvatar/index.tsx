import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';

// 使用指定风格头像
import { pixelArt } from '@dicebear/collection';

export default ({ className }: { className?: string }) => {
    const avatar = useMemo(() => {
        // 生成一个随机种子
        const seed = Math.random().toString(36).substring(2, 15);

        // 创建头像
        return createAvatar(pixelArt, {
            seed: seed, // 使用随机种子
            size: 128,
            // 其他选项
        }).toDataUriSync();
    }, []);

    return <img src={avatar} alt="Avatar" className={className} />
}