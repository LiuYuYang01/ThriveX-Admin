import { Permission } from '@/types/app/permission';
import { Role } from '@/types/app/role';
import { User } from '@/types/app/user';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  token: string;
  setToken: (data: string) => void;

  user: User;
  setUser: (data: User) => void;

  quitLogin: () => void;
}

export default create(
  persist<UserStore>(
    (set) => ({
      token: '',
      setToken: (token: string) => set(() => ({ token })),

      user: {} as User,
      setUser: (data: User) => set(() => ({ user: data })),
     
      // 退出登录
      quitLogin: () =>
        set(() => {
          localStorage.clear();
          sessionStorage.clear();
          location.href = '/login';

          return { token: '', user: {} as User };
        }),
    }),
    {
      name: 'user_storage',
      getStorage: () => localStorage,
      // 定义需要持久化存储的数据，默认表示全部持久化
      // partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
