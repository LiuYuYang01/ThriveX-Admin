import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import RouteList from './components/RouteList';
import '@/styles/antd.scss';

import { getWebConfigDataAPI } from '@/api/config';
import { useWebStore, useUserStore, useConfigStore, useFileStore } from './stores';
import { fetchFileConfig } from '@/utils/fileConfig';

import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

function App() {
  useAuthRedirect();

  const token = useUserStore((state) => state.token);
  const colorMode = useConfigStore((state) => state.colorMode);
  const isDark = colorMode === 'dark';
  const { pathname } = useLocation();

  // 明暗双套色板分层（参考 react-admin-template），主色沿用项目主色
  const theme = useMemo(() => {
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E4E7EC';
    const panelBg = isDark ? '#151B26' : '#FFFFFF';
    const elevatedBg = isDark ? '#1E2738' : '#FFFFFF';
    const fieldBg = isDark ? '#121820' : '#FFFFFF';
    const canvasBg = isDark ? '#0B0F14' : '#F5F6F8';
    const ink = isDark ? '#EEF2F8' : '#101828';
    const inkMuted = isDark ? '#B0BDD4' : '#475467';
    const inkFaint = isDark ? '#8A99B8' : '#98A2B3';
    const rowHover = isDark ? '#252F42' : '#F7F8FA';
    const railBg = isDark ? '#1F2838' : '#F8F9FB';
    const primary = '#60a5fa';
    const outline = `color-mix(in srgb, ${primary} 16%, transparent)`;
    const selectedBg = `color-mix(in srgb, ${primary} 18%, transparent)`;
    return {
      cssVar: { key: 'thrivex-admin' },
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: primary,
        colorInfo: primary,
        colorError: '#D92D20',
        colorLink: primary,
        colorPrimaryHover: '#3B82F6',
        colorTextBase: ink,
        colorText: ink,
        colorTextSecondary: inkMuted,
        colorTextTertiary: inkFaint,
        colorTextQuaternary: inkFaint,
        colorBgBase: panelBg,
        colorBgContainer: panelBg,
        colorBgElevated: elevatedBg,
        colorBgLayout: canvasBg,
        colorFillSecondary: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F2F4F7',
        colorFillTertiary: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8F9FB',
        colorFillQuaternary: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FCFCFD',
        colorBorder: lineColor,
        colorBorderSecondary: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F4F7',
        colorBgTextHover: rowHover,
        colorFillContentHover: rowHover,
        borderRadius: 8,
        borderRadiusLG: 10,
        borderRadiusSM: 6,
        fontSize: 14,
        controlHeight: 36,
        controlOutline: outline,
        controlOutlineWidth: 3,
        wireframe: false,
      },
      components: {
        Button: {
          primaryShadow: 'none',
          defaultShadow: 'none',
          dangerShadow: 'none',
          fontWeight: 560,
          contentLineHeight: 1,
          defaultBg: panelBg,
          defaultColor: ink,
          defaultBorderColor: lineColor,
          defaultHoverBg: rowHover,
          defaultHoverColor: ink,
          defaultHoverBorderColor: lineColor,
          defaultActiveBg: rowHover,
          defaultActiveColor: ink,
          defaultActiveBorderColor: lineColor,
          textHoverBg: rowHover,
          textTextHoverColor: ink,
        },
        Input: {
          colorBgContainer: fieldBg,
          colorText: ink,
          colorTextPlaceholder: inkFaint,
          colorBorder: lineColor,
          activeBorderColor: primary,
          hoverBorderColor: primary,
          activeShadow: `0 0 0 3px ${outline}`,
        },
        InputNumber: {
          colorBgContainer: fieldBg,
          colorText: ink,
          colorTextPlaceholder: inkFaint,
          colorBorder: lineColor,
          activeBorderColor: primary,
          hoverBorderColor: primary,
          activeShadow: `0 0 0 3px ${outline}`,
        },
        Select: {
          colorBgContainer: fieldBg,
          colorText: ink,
          colorTextPlaceholder: inkFaint,
          colorBorder: lineColor,
          optionSelectedBg: selectedBg,
          optionActiveBg: rowHover,
          activeBorderColor: primary,
          hoverBorderColor: primary,
          selectorBg: fieldBg,
        },
        DatePicker: {
          colorBgContainer: fieldBg,
          colorText: ink,
          colorTextPlaceholder: inkFaint,
          colorBorder: lineColor,
          activeBorderColor: primary,
          hoverBorderColor: primary,
          activeShadow: `0 0 0 3px ${outline}`,
        },
        Cascader: {
          colorBgContainer: fieldBg,
          colorBorder: lineColor,
          activeBorderColor: primary,
          hoverBorderColor: primary,
        },
        TreeSelect: {
          colorBgContainer: fieldBg,
          colorBorder: lineColor,
          activeBorderColor: primary,
          hoverBorderColor: primary,
        },
        Form: {
          labelColor: inkMuted,
        },
        Table: {
          colorBgContainer: panelBg,
          headerBg: railBg,
          headerColor: inkMuted,
          rowHoverBg: rowHover,
          borderColor: lineColor,
          headerSplitColor: 'transparent',
        },
        Card: {
          paddingLG: 16,
        },
        Modal: {
          contentBg: elevatedBg,
          headerBg: elevatedBg,
          titleColor: ink,
          colorIcon: inkFaint,
          colorIconHover: ink,
        },
        Drawer: {
          colorBgElevated: elevatedBg,
        },
        Pagination: {
          itemBg: panelBg,
          itemActiveBg: selectedBg,
          itemActiveColor: primary,
          colorText: inkMuted,
          colorPrimary: primary,
        },
        Dropdown: {
          colorBgElevated: elevatedBg,
          controlItemBgHover: rowHover,
        },
      },
    };
  }, [isDark]);

  // 静态 Modal.confirm / message / notification 不继承 React 树主题，需通过 holderRender 注入
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => (
        <ConfigProvider locale={zhCN} theme={theme}>
          {children}
        </ConfigProvider>
      ),
    });
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const setWeb = useWebStore((state) => state.setWeb);
  const setFile = useFileStore((state) => state.setFile);

  const loadAppConfig = async () => {
    if (!token) return;
    const [webRes, fileConfig] = await Promise.all([getWebConfigDataAPI('web'), fetchFileConfig()]);
    setWeb(webRes.data.value);
    setFile(fileConfig);
  };

  useEffect(() => {
    loadAppConfig();
  }, [token]);

  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntdApp>
        <RouteList />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
