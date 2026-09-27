import { useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Radio, Select, Switch, TimePicker, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import { updateEnvConfigDataAPI } from '@/api/config';
import { BackupStorageEnvValue, Config, QiniuStorageEnvValue } from '@/types/app/config';

interface BackupStorageFormProps {
  row: Config | undefined;
  qiniuRow: Config | undefined;
  onSaved: () => void;
}

type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'custom';

const WEEKDAY_OPTIONS = [
  { value: 'MON', label: '周一' },
  { value: 'TUE', label: '周二' },
  { value: 'WED', label: '周三' },
  { value: 'THU', label: '周四' },
  { value: 'FRI', label: '周五' },
  { value: 'SAT', label: '周六' },
  { value: 'SUN', label: '周日' },
];

// 仅提供 1~28 号，避免大小月缺日导致当月不执行
const MONTHDAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: `${i + 1} 号` }));

const DEFAULT_CRON = '0 0 3 * * ?';

// 从 cron 反解析出可读的频率与时间，解析不了的（如高级表达式）回退自定义模式
function parseSchedule(cron: string): { type: ScheduleType; weekday: string; monthday: number; time: Dayjs } {
  const fallback = { type: 'custom' as const, weekday: 'MON', monthday: 1, time: dayjs('03:00', 'HH:mm') };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 6 || parts[0] !== '0') return fallback;
  const [, minute, hour, dom, month, dow] = parts;
  const m = Number(minute);
  const h = Number(hour);
  if (!Number.isInteger(m) || !Number.isInteger(h) || m > 59 || h > 23) return fallback;
  const time = dayjs().hour(h).minute(m).second(0);
  if (dom === '*' && month === '*' && dow === '?') {
    return { type: 'daily', weekday: 'MON', monthday: 1, time };
  }
  if (dom === '?' && month === '*' && WEEKDAY_OPTIONS.some((w) => w.value === dow)) {
    return { type: 'weekly', weekday: dow, monthday: 1, time };
  }
  if (month === '*' && dow === '?' && /^\d{1,2}$/.test(dom) && Number(dom) >= 1 && Number(dom) <= 28) {
    return { type: 'monthly', weekday: 'MON', monthday: Number(dom), time };
  }
  return fallback;
}

/** 备份存储：本地磁盘或七牛私有桶（AK/SK 复用「文件存储」中的七牛密钥），并管理定时备份 */
export default function BackupStorageForm({ row, qiniuRow, onSaved }: BackupStorageFormProps) {
  const [form] = Form.useForm<BackupStorageEnvValue>();
  const [saving, setSaving] = useState(false);
  const type = Form.useWatch('type', form) ?? 'local';
  const enabled = Form.useWatch('enabled', form) ?? false;
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [weekday, setWeekday] = useState<string>('MON');
  const [monthday, setMonthday] = useState<number>(1);
  const [time, setTime] = useState<Dayjs>(() => dayjs('03:00', 'HH:mm'));

  useEffect(() => {
    const v = row?.value as Partial<BackupStorageEnvValue> | undefined;
    form.setFieldsValue({
      type: v?.type ?? 'local',
      bucket_name: v?.bucket_name ?? '',
      domain: v?.domain ?? '',
      enabled: v?.enabled ?? false,
      retain_count: v?.retain_count ?? 10,
      cron: v?.cron ?? DEFAULT_CRON,
    });
    const parsed = parseSchedule(v?.cron ?? DEFAULT_CRON);
    setScheduleType(parsed.type);
    setWeekday(parsed.weekday);
    setMonthday(parsed.monthday);
    setTime(parsed.time);
  }, [row, form]);

  // 后端缺少 backup_storage 配置项（多为后端未升级/未重启）时无法保存，直接醒目提示
  if (!row) {
    return (
      <Alert
        className="w-full"
        type="warning"
        showIcon
        message="未找到备份存储配置项（backup_storage）"
        description="请确认后端服务已更新为包含备份存储支持的版本并重启，启动时会自动补齐该配置项；在此之前无法保存备份存储与定时备份配置。"
      />
    );
  }

  const qiniuConfigured = !!(qiniuRow?.value as Partial<QiniuStorageEnvValue> | undefined)?.access_key;

  // 频率选择生成 cron，仅「高级」模式让用户直接写表达式
  const buildCron = (): string => {
    const mm = (time ?? dayjs('03:00', 'HH:mm')).minute();
    const hh = (time ?? dayjs('03:00', 'HH:mm')).hour();
    if (scheduleType === 'weekly') return `0 ${mm} ${hh} ? * ${weekday}`;
    if (scheduleType === 'monthly') return `0 ${mm} ${hh} ${monthday} * ?`;
    if (scheduleType === 'custom') return (form.getFieldValue('cron') as string | undefined)?.trim() ?? '';
    return `0 ${mm} ${hh} * * ?`;
  };

  const onFinish = async (values: BackupStorageEnvValue) => {
    // 关闭定时备份时 cron 不参与编辑，保留库中原值
    const previousCron = (row.value as Partial<BackupStorageEnvValue> | undefined)?.cron;
    const cron = enabled ? buildCron() : previousCron;
    if (enabled && !cron) {
      message.warning('请输入 cron 表达式');
      return;
    }
    setSaving(true);
    try {
      const value: BackupStorageEnvValue = {
        type: values.type,
        bucket_name: values.bucket_name ?? '',
        domain: values.domain ?? '',
        enabled: values.enabled ?? false,
        cron: cron || DEFAULT_CRON,
        retain_count: values.retain_count ?? 10,
      };
      await updateEnvConfigDataAPI({ ...row, value });
      message.success('保存成功，下一次备份将按新配置存储');
      onSaved();
    } catch (e) {
      console.error(e);
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large" onFinish={onFinish} className="w-full">
      <Form.Item name="type" label="存储方式">
        <Radio.Group>
          <Radio.Button value="local">本地存储</Radio.Button>
          <Radio.Button value="qiniu">七牛云私有桶</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {type === 'local' && (
        <Alert
          className="mb-5!"
          type="info"
          showIcon
          message="备份文件将保存在服务器本地 backup 目录"
        />
      )}

      {type === 'qiniu' && (
        <>
          <Alert
            className="mb-5!"
            type={qiniuConfigured ? 'info' : 'warning'}
            showIcon
            message={
              qiniuConfigured
                ? '备份写入独立的七牛私有桶，密钥复用「文件存储」中的七牛 AK/SK；下载经服务端签名中转，密钥与签名不会暴露给浏览器'
                : '尚未配置七牛密钥：请先在「文件存储」中填写七牛 Access Key / Secret Key，并确保下方存储桶指向一个「私有」空间'
            }
          />
          <Form.Item name="bucket_name" label="私有桶名称" rules={[{ required: true, message: '请输入私有桶名称' }]}>
            <Input placeholder="thrivex-backup" />
          </Form.Item>
          <Form.Item
            name="domain"
            label="下载域名"
            rules={[{ required: true, message: '请输入私有桶绑定的下载域名' }]}
            extra="七牛测试域名仅 30 天有效且只支持 HTTP，正式使用建议绑定已备案域名的子域名"
          >
            <Input placeholder="https://backup.example.com" />
          </Form.Item>
        </>
      )}

      <Form.Item name="enabled" label="定时备份" valuePropName="checked">
        <Switch />
      </Form.Item>

      {enabled && (
        <>
          <Form.Item label="执行频率">
            <Radio.Group value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)}>
              <Radio.Button value="daily">每天</Radio.Button>
              <Radio.Button value="weekly">每周</Radio.Button>
              <Radio.Button value="monthly">每月</Radio.Button>
              <Radio.Button value="custom">高级</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {scheduleType === 'weekly' && (
            <Form.Item label="执行日">
              <Select value={weekday} onChange={setWeekday} options={WEEKDAY_OPTIONS} className="w-40" />
            </Form.Item>
          )}

          {scheduleType === 'monthly' && (
            <Form.Item label="执行日">
              <Select value={monthday} onChange={setMonthday} options={MONTHDAY_OPTIONS} className="w-40" />
            </Form.Item>
          )}

          {scheduleType === 'custom' ? (
            <Form.Item
              name="cron"
              label="Cron 表达式"
              rules={[{ required: true, message: '请输入 cron 表达式' }]}
              extra="Spring cron 表达式（秒 分 时 日 月 周），保存后即时生效"
            >
              <Input placeholder="0 0 3 * * ?" />
            </Form.Item>
          ) : (
            <Form.Item label="执行时间" extra="按服务器时间执行，保存后即时生效">
              <TimePicker value={time} onChange={(t) => t && setTime(t)} format="HH:mm" allowClear={false} />
            </Form.Item>
          )}

          <Form.Item
            name="retain_count"
            label="保留份数"
            extra="每次定时备份成功后仅保留最近 N 份备份（含手动备份），0 表示不清理"
          >
            <InputNumber className="w-40" min={0} precision={0} />
          </Form.Item>
        </>
      )}

      <Button type="primary" htmlType="submit" loading={saving} className="w-full">
        确定
      </Button>
    </Form>
  );
}
