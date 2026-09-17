import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryApi } from '@/api';
import { categoryValidators } from '@/utils/validators';
import { formatDate } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useForm from '@/hooks/useForm';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input, { Textarea, Checkbox } from '@/components/ui/Input';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/States';

const AdminCategoriesPage = () => {
  const toast = useToast();
  const resource = useApiResource(() => categoryApi.list({ includeInactive: true }), []);

  const [modal, setModal] = useState({ open: false, category: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    initialValues: { name: '', description: '', isActive: true },
    validators: categoryValidators,
    onSubmit: async (values) => {
      const response = modal.category
        ? await categoryApi.update(modal.category._id, values)
        : await categoryApi.create(values);

      toast.success(response.message);
      setModal({ open: false, category: null });
      await resource.reload();
    },
  });

  const openModal = (category = null) => {
    form.reset(
      category
        ? { name: category.name, description: category.description ?? '', isActive: category.isActive }
        : { name: '', description: '', isActive: true }
    );
    setModal({ open: true, category });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await categoryApi.remove(deleteTarget._id);
      toast.success(response.message);
      setDeleteTarget(null);
      await resource.reload();
    } catch (error) {
      // 409 means products still reference it — surface the reason, not a generic failure.
      toast.error(error.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const categories = resource.data?.categories ?? [];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Categories drive the storefront navigation and the product filters."
        actions={<Button onClick={() => openModal()}>Add category</Button>}
      />

      <DataTable
        className="mt-6"
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
        rows={categories}
        emptyTitle="No categories yet"
        emptyDescription="Create a category before adding products — every product needs one."
        emptyAction={<Button onClick={() => openModal()}>Create your first category</Button>}
        columns={[
          {
            key: 'name',
            header: 'Category',
            render: (category) => (
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{category.name}</p>
                <p className="truncate text-xs text-ink-500">/{category.slug}</p>
              </div>
            ),
          },
          {
            key: 'description',
            header: 'Description',
            render: (category) => (
              <p className="max-w-md truncate text-ink-600">{category.description || '—'}</p>
            ),
          },
          {
            key: 'productCount',
            header: 'Products',
            render: (category) => (
              <Link
                to={`/admin/products?category=${category._id}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                {category.productCount ?? 0}
              </Link>
            ),
          },
          {
            key: 'isActive',
            header: 'Status',
            render: (category) =>
              category.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Hidden</Badge>,
          },
          {
            key: 'createdAt',
            header: 'Created',
            render: (category) => <span className="text-ink-500">{formatDate(category.createdAt)}</span>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (category) => (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="xs" onClick={() => openModal(category)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-danger-600"
                  onClick={() => setDeleteTarget(category)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        renderMobileCard={(category) => (
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{category.name}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-500">{category.description || '—'}</p>
              </div>
              {category.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Hidden</Badge>}
            </div>

            <p className="mt-2 text-sm text-ink-600">{category.productCount ?? 0} products</p>

            <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
              <Button variant="outline" size="xs" className="flex-1" onClick={() => openModal(category)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="flex-1 text-danger-600"
                onClick={() => setDeleteTarget(category)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, category: null })}
        title={modal.category ? 'Edit category' : 'New category'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal({ open: false, category: null })}>
              Cancel
            </Button>
            <Button onClick={form.handleSubmit} loading={form.submitting}>
              {modal.category ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit} className="space-y-4" noValidate>
          {form.submitError && <Alert tone="error">{form.submitError}</Alert>}

          <Input label="Category name" required placeholder="Electronics" {...form.fieldProps('name')} />

          <Textarea
            label="Description"
            rows={3}
            placeholder="What belongs in this category?"
            {...form.fieldProps('description')}
          />

          <Checkbox
            label="Visible in the store"
            description="Hidden categories stay in the admin but disappear from storefront filters."
            checked={Boolean(form.values.isActive)}
            onChange={(event) => form.setValue('isActive', event.target.checked)}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${deleteTarget?.name}"?`}
        description="A category that still has products cannot be deleted — move or delete those products first, or hide the category instead."
        confirmLabel="Delete category"
      />
    </div>
  );
};

export default AdminCategoriesPage;
