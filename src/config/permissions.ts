export type PermissionKey =
  | 'trip.create' | 'trip.update' | 'trip.delete'
  | 'member.create' | 'member.update' | 'member.delete' | 'member.view'
  | 'deposit.create' | 'deposit.update' | 'deposit.delete' | 'deposit.view'
  | 'withdrawal.create' | 'withdrawal.update' | 'withdrawal.delete' | 'withdrawal.view'
  | 'settlement.create' | 'settlement.update' | 'settlement.delete' | 'settlement.view'
  | 'ratings.view' | 'ratings.submit' | 'ratings.update' | 'ratings.delete'
  | 'notifications.manage' | 'notifications.send'
  | 'settings.manage'
  | 'dashboard.view'
  | 'permissions.manage'
  | 'roles.manage';

export interface PermissionDefinition {
  key: PermissionKey;
  label: { en: string; fa: string };
  group: string;
  description: { en: string; fa: string };
}

export const PERMISSIONS: PermissionDefinition[] = [
  { key: 'trip.create',        label: { en: 'Create trips', fa: 'ایجاد سفر' },             group: 'trip',        description: { en: 'Create new trips', fa: 'ایجاد سفرهای جدید' } },
  { key: 'trip.update',        label: { en: 'Update trips', fa: 'ویرایش سفر' },             group: 'trip',        description: { en: 'Edit trip details', fa: 'ویرایش جزئیات سفر' } },
  { key: 'trip.delete',        label: { en: 'Delete trips', fa: 'حذف سفر' },                group: 'trip',        description: { en: 'Delete trips', fa: 'حذف سفرها' } },

  { key: 'member.create',      label: { en: 'Create members', fa: 'ایجاد عضو' },            group: 'member',      description: { en: 'Add new members', fa: 'افزودن اعضای جدید' } },
  { key: 'member.update',      label: { en: 'Update members', fa: 'ویرایش عضو' },           group: 'member',      description: { en: 'Edit member details', fa: 'ویرایش جزئیات عضو' } },
  { key: 'member.delete',      label: { en: 'Delete members', fa: 'حذف عضو' },              group: 'member',      description: { en: 'Remove members from trip', fa: 'حذف عضو از سفر' } },
  { key: 'member.view',        label: { en: 'View members', fa: 'مشاهده اعضا' },            group: 'member',      description: { en: 'View member list', fa: 'مشاهده لیست اعضا' } },

  { key: 'deposit.create',     label: { en: 'Create deposits', fa: 'ایجاد واریز' },         group: 'deposit',     description: { en: 'Record new deposits', fa: 'ثبت واریزی جدید' } },
  { key: 'deposit.update',     label: { en: 'Update deposits', fa: 'ویرایش واریز' },        group: 'deposit',     description: { en: 'Edit deposit records', fa: 'ویرایش واریزی‌ها' } },
  { key: 'deposit.delete',     label: { en: 'Delete deposits', fa: 'حذف واریز' },           group: 'deposit',     description: { en: 'Delete deposit records', fa: 'حذف واریزی‌ها' } },
  { key: 'deposit.view',       label: { en: 'View deposits', fa: 'مشاهده واریز' },          group: 'deposit',     description: { en: 'View deposit records', fa: 'مشاهده واریزی‌ها' } },

  { key: 'withdrawal.create',  label: { en: 'Create expenses', fa: 'ایجاد هزینه' },          group: 'withdrawal',  description: { en: 'Record new expenses', fa: 'ثبت هزینه جدید' } },
  { key: 'withdrawal.update',  label: { en: 'Update expenses', fa: 'ویرایش هزینه' },         group: 'withdrawal',  description: { en: 'Edit expense records', fa: 'ویرایش هزینه‌ها' } },
  { key: 'withdrawal.delete',  label: { en: 'Delete expenses', fa: 'حذف هزینه' },            group: 'withdrawal',  description: { en: 'Delete expense records', fa: 'حذف هزینه‌ها' } },
  { key: 'withdrawal.view',    label: { en: 'View expenses', fa: 'مشاهده هزینه' },           group: 'withdrawal',  description: { en: 'View expense records', fa: 'مشاهده هزینه‌ها' } },

  { key: 'settlement.create',  label: { en: 'Record settlements', fa: 'ثبت تسویه' },         group: 'settlement',  description: { en: 'Record settlement payments', fa: 'ثبت پرداخت تسویه' } },
  { key: 'settlement.update',  label: { en: 'Update settlements', fa: 'ویرایش تسویه' },      group: 'settlement',  description: { en: 'Edit settlement records', fa: 'ویرایش تسویه‌ها' } },
  { key: 'settlement.delete',  label: { en: 'Delete settlements', fa: 'حذف تسویه' },         group: 'settlement',  description: { en: 'Delete settlement records', fa: 'حذف تسویه‌ها' } },
  { key: 'settlement.view',    label: { en: 'View settlements', fa: 'مشاهده تسویه' },        group: 'settlement',  description: { en: 'View settlement records', fa: 'مشاهده تسویه‌ها' } },

  { key: 'ratings.view',       label: { en: 'View ratings', fa: 'مشاهده ارزیابی' },          group: 'ratings',     description: { en: 'View rating results', fa: 'مشاهده نتایج ارزیابی' } },
  { key: 'ratings.submit',     label: { en: 'Submit ratings', fa: 'ثبت ارزیابی' },           group: 'ratings',     description: { en: 'Submit member ratings', fa: 'ثبت ارزیابی اعضا' } },
  { key: 'ratings.update',     label: { en: 'Update ratings', fa: 'ویرایش ارزیابی' },        group: 'ratings',     description: { en: 'Edit ratings', fa: 'ویرایش ارزیابی‌ها' } },
  { key: 'ratings.delete',     label: { en: 'Delete ratings', fa: 'حذف ارزیابی' },           group: 'ratings',     description: { en: 'Delete ratings', fa: 'حذف ارزیابی‌ها' } },

  { key: 'notifications.manage', label: { en: 'Manage notifications', fa: 'مدیریت اعلان‌ها' }, group: 'notifications', description: { en: 'Configure notification settings', fa: 'پیکربندی تنظیمات اعلان' } },
  { key: 'notifications.send',  label: { en: 'Send notifications', fa: 'ارسال اعلان' },       group: 'notifications', description: { en: 'Send notifications to Telegram', fa: 'ارسال اعلان به تلگرام' } },

  { key: 'settings.manage',    label: { en: 'Manage settings', fa: 'مدیریت تنظیمات' },       group: 'settings',    description: { en: 'Manage trip settings', fa: 'مدیریت تنظیمات سفر' } },

  { key: 'dashboard.view',     label: { en: 'View dashboard', fa: 'مشاهده داشبورد' },        group: 'dashboard',   description: { en: 'View trip dashboard', fa: 'مشاهده داشبورد سفر' } },

  { key: 'permissions.manage', label: { en: 'Manage permissions', fa: 'مدیریت دسترسی‌ها' },  group: 'permissions',  description: { en: 'Manage member permissions', fa: 'مدیریت دسترسی‌های اعضا' } },

  { key: 'roles.manage',       label: { en: 'Manage roles', fa: 'مدیریت نقش‌ها' },            group: 'roles',       description: { en: 'Create and manage custom roles', fa: 'ایجاد و مدیریت نقش‌های سفارشی' } },
];

export const PERMISSION_GROUPS = [...new Set(PERMISSIONS.map(p => p.group))];

export const ROLE_DEFAULTS: Record<string, { all?: boolean; allow?: PermissionKey[]; deny?: PermissionKey[] }> = {
  admin: { all: true },
  owner: { all: true },
  member: {
    allow: [
      'dashboard.view',
      'member.view',
      'deposit.view',
      'withdrawal.create',
      'withdrawal.view',
      'settlement.view',
      'ratings.view',
      'ratings.submit',
    ],
  },
};

export function getPermissionsByGroup(group: string): PermissionDefinition[] {
  return PERMISSIONS.filter(p => p.group === group);
}

export function isValidPermission(key: string): key is PermissionKey {
  return PERMISSIONS.some(p => p.key === key);
}
