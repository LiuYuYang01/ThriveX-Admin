import { useState, useEffect } from 'react';
import { message } from 'antd';
import { testAssistantConnection, callAssistantAPI } from '@/services/assistant';
import { Assistant } from '@/types/app/assistant';
import { delAssistantDataAPI, getAssistantListAPI, addAssistantDataAPI, editAssistantDataAPI, setDefaultAssistantAPI } from '@/api/assistant';

export default function useAssistant() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});

  const [list, setList] = useState<Assistant[]>([]);
  const [assistant, setAssistant] = useState<string | null>(null);

  // 获取助手列表
  const getAssistantList = async () => {
    try {
      const { data } = await getAssistantListAPI();
      setList(data);

      const defaultAssistant = data.find((a) => a.isDefault);
      if (defaultAssistant) setAssistant(String(defaultAssistant.id));
    } catch (error) {
      console.error('获取助手列表失败：', error);
    } finally {
      setListLoading(false);
    }
  };

  // 初始化加载助手列表
  useEffect(() => {
    getAssistantList();
  }, []);

  // 添加或更新助手
  const saveAssistant = async (assistant: Assistant) => {
    setLoading(true);

    try {
      if (assistant.id) {
        // 更新现有助手
        await editAssistantDataAPI(assistant);
      } else {
        // 添加新助手
        await addAssistantDataAPI(assistant);
      }

      // 更新成功后重新获取列表
      await getAssistantList();
      message.success(assistant.id ? '助手已更新' : '助手已添加');
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 删除助手
  const delAssistantData = async (id: number) => {
    await delAssistantDataAPI(id);
    getAssistantList();
    message.success('助手已删除');
  };

  // 设置默认助手
  const setDefaultAssistant = async (id: number) => {
    await setDefaultAssistantAPI(id);
    getAssistantList();
    message.success('默认助手已更新');
  };

  // 测试助手连接
  const testConnection = async (assistant: Assistant) => {
    setTestingMap((prev) => ({ ...prev, [assistant.id]: true }));
    try {
      const result = await testAssistantConnection(assistant);
      return result;
    } finally {
      setTestingMap((prev) => ({ ...prev, [assistant.id]: false }));
    }
  };

  // 调用助手API
  const callAssistant = async (
    messages: Array<{ role: string; content: string }>,
    options?: {
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
    },
  ) => {
    if (!assistant) {
      message.error('请先选择助手');
      return null;
    }

    const data = list.find((a) => a.id === Number(assistant));
    if (!data) {
      message.error('助手不存在');
      return null;
    }

    return callAssistantAPI(data, messages, options);
  };

  return {
    list,
    assistant,
    setAssistant,
    loading,
    listLoading,
    testingMap,
    saveAssistant,
    delAssistantData,
    setDefaultAssistant,
    testConnection,
    callAssistant,
  };
}
