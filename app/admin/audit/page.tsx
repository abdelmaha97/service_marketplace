'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Trash2,
  AlertTriangle,
  CheckSquare,
  X,
  Eye,
  Calendar,
  User,
  Activity,
  Database,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentLog, setCurrentLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    if (user) {
      loadAuditLogs();
    }
  }, [user, pagination.page, pagination.limit, searchQuery, filterAction, filterResourceType]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filterAction && filterAction !== 'all') params.append('action', filterAction);
      if (filterResourceType && filterResourceType !== 'all') params.append('resource_type', filterResourceType);

      const data = await api.get<{ auditLogs: AuditLog[], pagination: PaginationInfo }>(
        `/admin/audit_logs?${params.toString()}`
      );

      setAuditLogs(data.auditLogs);
      setPagination(data.pagination);
      setMessage(null);
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'فشل تحميل سجلات التدقيق' : 'Failed to load audit logs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async () => {
    const idsToDelete = selectedLogs.size > 0
      ? Array.from(selectedLogs)
      : currentLog ? [currentLog.id] : [];

    if (idsToDelete.length === 0) return;

    try {
      setActionLoading(true);

      for (const id of idsToDelete) {
        await api.delete(`/admin/audit_logs/${id}`);
      }

      setMessage({
        type: 'success',
        text: language === 'ar'
          ? `تم حذف ${idsToDelete.length} سجل بنجاح`
          : `Successfully deleted ${idsToDelete.length} log(s)`
      });
      setShowDeleteDialog(false);
      setSelectedLogs(new Set());
      setCurrentLog(null);
      setDeleteMode(false);
      await loadAuditLogs();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || (language === 'ar' ? 'فشل حذف السجلات' : 'Failed to delete logs')
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLogs.size === auditLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(auditLogs.map(log => log.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLogs(newSelected);
  };

  const getActionBadge = (action: string) => {
    const actions: any = {
      create: { label: language === 'ar' ? 'إنشاء' : 'Create', className: 'bg-green-50 text-green-700 border-green-200' },
      update: { label: language === 'ar' ? 'تحديث' : 'Update', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      delete: { label: language === 'ar' ? 'حذف' : 'Delete', className: 'bg-red-50 text-red-700 border-red-200' },
      login: { label: language === 'ar' ? 'دخول' : 'Login', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      logout: { label: language === 'ar' ? 'خروج' : 'Logout', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    };
    return actions[action] || { label: action, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const getResourceTypeBadge = (resourceType: string) => {
    const types: any = {
      user: { label: language === 'ar' ? 'مستخدم' : 'User', variant: 'default' },
      booking: { label: language === 'ar' ? 'حجز' : 'Booking', variant: 'secondary' },
      service: { label: language === 'ar' ? 'خدمة' : 'Service', variant: 'outline' },
      payment: { label: language === 'ar' ? 'دفع' : 'Payment', variant: 'secondary' },
    };
    return types[resourceType] || { label: resourceType, variant: 'outline' };
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const enableDeleteMode = () => {
    setDeleteMode(true);
    setSelectedLogs(new Set());
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedLogs(new Set());
  };

  const openViewDialog = (log: AuditLog) => {
    setCurrentLog(log);
    setShowViewDialog(true);
  };

  if (loading && auditLogs.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  function handleDeleteUser(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="w-8 h-8" />
                {language === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === 'ar'
                  ? `إجمالي السجلات: ${pagination.total}`
                  : `Total Logs: ${pagination.total}`}
              </p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search logs...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الإجراء' : 'Action'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الإجراءات' : 'All Actions'}</SelectItem>
                  <SelectItem value="create">{language === 'ar' ? 'إنشاء' : 'Create'}</SelectItem>
                  <SelectItem value="update">{language === 'ar' ? 'تحديث' : 'Update'}</SelectItem>
                  <SelectItem value="delete">{language === 'ar' ? 'حذف' : 'Delete'}</SelectItem>
                  <SelectItem value="login">{language === 'ar' ? 'دخول' : 'Login'}</SelectItem>
                  <SelectItem value="logout">{language === 'ar' ? 'خروج' : 'Logout'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterResourceType} onValueChange={setFilterResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'نوع المورد' : 'Resource Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                  <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                  <SelectItem value="booking">{language === 'ar' ? 'حجز' : 'Booking'}</SelectItem>
                  <SelectItem value="service">{language === 'ar' ? 'خدمة' : 'Service'}</SelectItem>
                  <SelectItem value="payment">{language === 'ar' ? 'دفع' : 'Payment'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deleteMode && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedLogs.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === 'ar'
                    ? `حذف المحدد (${selectedLogs.size})`
                    : `Delete Selected (${selectedLogs.size})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDeleteMode}
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            )}

            {!deleteMode && auditLogs.length > 1 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enableDeleteMode}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حذف متعدد' : 'Multi Delete'}
                </Button>
              </div>
            )}
          </Card>

          {/* Audit Logs List */}
          <div className="space-y-4">
            {/* Table Header - Sticky */}
            {auditLogs.length > 0 && (
              <div className="sticky top-0 z-10 bg-background">
                <Card className="p-4 shadow-sm border-b-2">
                  <div className="flex items-center gap-4">
                    {deleteMode && (
                      <div className="w-5 h-5 flex-shrink-0"></div>
                    )}

                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Action */}
                      <div className="flex-shrink-0 min-w-[100px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الإجراء' : 'Action'}
                        </span>
                      </div>

                      {/* Resource Type */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'نوع المورد' : 'Resource Type'}
                        </span>
                      </div>

                      {/* Resource ID */}
                      <div className="flex-shrink-0 min-w-[150px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'معرف المورد' : 'Resource ID'}
                        </span>
                      </div>

                      {/* User ID */}
                      <div className="flex-shrink-0 min-w-[150px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'المستخدم' : 'User'}
                        </span>
                      </div>

                      {/* IP Address */}
                      <div className="flex-shrink-0 min-w-[120px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex-shrink-0 min-w-[150px]">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'التاريخ' : 'Date'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Header */}
                    {!deleteMode && (
                      <div className="flex-shrink-0 min-w-[80px] text-center">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {language === 'ar' ? 'الإجراءات' : 'Actions'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {auditLogs.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  {searchQuery || filterAction !== 'all' || filterResourceType !== 'all'
                    ? language === 'ar' ? 'لا توجد نتائج' : 'No results found'
                    : language === 'ar' ? 'لا يوجد سجلات حتى الآن' : 'No logs yet'}
                </p>
              </Card>
            ) : (
              <>
                {deleteMode && (
                  <div className="flex items-center gap-2 px-4">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded transition-colors"
                    >
                      <CheckSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedLogs.size === auditLogs.length
                          ? language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All'
                          : language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </button>
                  </div>
                )}

                {auditLogs.map((log) => (
                  <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {deleteMode && (
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleSelect(log.id)}
                          className="w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        />
                      )}

                      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">
                        {/* Action Badge */}
                        <div className="flex-shrink-0 min-w-[100px]">
                          <Badge variant="outline" className={getActionBadge(log.action).className}>
                            <Activity className="w-3 h-3 mr-1" />
                            {getActionBadge(log.action).label}
                          </Badge>
                        </div>

                        {/* Resource Type Badge */}
                        <div className="flex-shrink-0 min-w-[120px]">
                          <Badge variant={getResourceTypeBadge(log.resource_type).variant as any}>
                            <Database className="w-3 h-3 mr-1" />
                            {getResourceTypeBadge(log.resource_type).label}
                          </Badge>
                        </div>

                        {/* Resource ID */}
                        <div className="flex-shrink-0 min-w-[150px]">
                          <span className="text-sm text-muted-foreground truncate font-mono">
                            {log.resource_id || '-'}
                          </span>
                        </div>

                        {/* User ID */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[150px]">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate font-mono">
                            {log.user_id.substring(0, 8)}...
                          </span>
                        </div>

                        {/* IP Address */}
                        <div className="flex-shrink-0 min-w-[120px]">
                          <span className="text-sm text-muted-foreground" dir="ltr">
                            {log.ip_address || '-'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[150px]">
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!deleteMode && (
                        <div className="flex items-center gap-2 flex-shrink-0 min-w-[80px] justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(log)}
                            className="h-9 w-9 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentLog(log);
                              setShowDeleteDialog(true);
                            }}
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `الصفحة ${pagination.page} من ${pagination.totalPages}`
                  : `Page ${pagination.page} of ${pagination.totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {/* View Log Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {language === 'ar' ? 'تفاصيل السجل' : 'Log Details'}
                </DialogTitle>
              </DialogHeader>

              {currentLog && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'الإجراء' : 'Action'}
                      </label>
                      <Badge variant="outline" className={getActionBadge(currentLog.action).className}>
                        {getActionBadge(currentLog.action).label}
                      </Badge>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'نوع المورد' : 'Resource Type'}
                      </label>
                      <Badge variant={getResourceTypeBadge(currentLog.resource_type).variant as any}>
                        {getResourceTypeBadge(currentLog.resource_type).label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'معرف المورد' : 'Resource ID'}
                    </label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {currentLog.resource_id || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'معرف المستخدم' : 'User ID'}
                    </label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {currentLog.user_id}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                    </label>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {currentLog.ip_address || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'وكيل المستخدم' : 'User Agent'}
                    </label>
                    <p className="text-sm text-muted-foreground break-all">
                      {currentLog.user_agent || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentLog.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'ar' ? 'التغييرات' : 'Changes'}
                    </label>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                      {JSON.stringify(currentLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </DialogTitle>
                <DialogDescription>
                  {selectedLogs.size > 0
                    ? language === 'ar'
                      ? `هل أنت متأكد من حذف ${selectedLogs.size} سجل؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${selectedLogs.size} log(s)? This action cannot be undone.`
                    : language === 'ar'
                      ? 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.'
                      : 'Are you sure you want to delete this log? This action cannot be undone.'
                  }
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={actionLoading}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {language === 'ar' ? 'جارٍ الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}