import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, categoryApi } from '@/api';
import { productValidators } from '@/utils/validators';
import { formatCurrency } from '@/utils/format';
import useApiResource from '@/hooks/useApiResource';
import useForm from '@/hooks/useForm';
import useToast from '@/hooks/useToast';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select, Checkbox } from '@/components/ui/Input';
import { Alert, ErrorState } from '@/components/ui/States';
import { LoadingBlock } from '@/components/ui/Spinner';
import cn from '@/utils/cn';

const MAX_IMAGES = 6;

const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const categories = useApiResource(() => categoryApi.list(), []);
  const existing = useApiResource(() => productApi.detail(id), [id], { immediate: isEdit });

  // Images already stored in Cloudinary, and the ones queued for removal.
  const [currentImages, setCurrentImages] = useState([]);
  const [removedPublicIds, setRemovedPublicIds] = useState([]);

  // Newly picked files plus their local previews.
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: '',
      brand: '',
      stock: '',
      isActive: true,
      isFeatured: false,
    },
    validators: productValidators,
    onSubmit: async (values) => {
      const remainingCount = currentImages.length + newFiles.length;
      if (remainingCount === 0) {
        throw Object.assign(new Error('Add at least one product image.'), { fieldErrors: {} });
      }

      // multipart/form-data — images stream through the API to Cloudinary.
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('price', values.price);
      formData.append('discountPrice', values.discountPrice === '' ? '' : values.discountPrice);
      formData.append('category', values.category);
      formData.append('brand', values.brand);
      formData.append('stock', values.stock);
      formData.append('isFeatured', String(values.isFeatured));
      if (isEdit) formData.append('isActive', String(values.isActive));

      newFiles.forEach((file) => formData.append('images', file));
      if (removedPublicIds.length) formData.append('removeImages', removedPublicIds.join(','));

      const response = isEdit
        ? await productApi.update(id, formData)
        : await productApi.create(formData);

      toast.success(response.message);
      navigate('/admin/products');
    },
  });

  /* Hydrate the form when editing. */
  useEffect(() => {
    const product = existing.data?.product;
    if (!product) return;

    form.reset({
      name: product.name,
      description: product.description,
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      category: product.category?._id ?? product.category ?? '',
      brand: product.brand,
      stock: String(product.stock),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    setCurrentImages(product.images ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data]);

  /* Revoke object URLs so previews do not leak memory. */
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const [dragging, setDragging] = useState(false);

  const acceptFiles = (fileList) => {
    const picked = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));
    const room = MAX_IMAGES - (currentImages.length + newFiles.length);

    if (picked.length > room) {
      toast.warning(`You can have ${MAX_IMAGES} images in total. Only the first ${Math.max(0, room)} were added.`);
    }

    const accepted = picked.slice(0, Math.max(0, room));
    setNewFiles((files) => [...files, ...accepted]);
    setPreviews((urls) => [...urls, ...accepted.map((file) => URL.createObjectURL(file))]);
  };

  const handleFileChange = (event) => {
    acceptFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(event.dataTransfer?.files);
  };

  const removeExistingImage = (publicId) => {
    setCurrentImages((images) => images.filter((image) => image.publicId !== publicId));
    setRemovedPublicIds((ids) => [...ids, publicId]);
  };

  const removeNewFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setNewFiles((files) => files.filter((_, position) => position !== index));
    setPreviews((urls) => urls.filter((_, position) => position !== index));
  };

  if (isEdit && existing.loading) return <LoadingBlock label="Loading product…" />;

  if (isEdit && existing.error) {
    return (
      <div>
        <ErrorState title="Could not load this product" error={existing.error} onRetry={existing.reload} />
        <div className="mt-6 text-center">
          <Button to="/admin/products" variant="outline">
            Back to products
          </Button>
        </div>
      </div>
    );
  }

  const totalImages = currentImages.length + newFiles.length;
  const price = Number(form.values.price) || 0;
  const discount = Number(form.values.discountPrice) || 0;
  const savingPercent = price > 0 && discount > 0 && discount < price
    ? Math.round(((price - discount) / price) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        back="/admin/products"
        backLabel="Back to products"
        title={isEdit ? 'Edit product' : 'New product'}
        description={
          isEdit ? 'Update the details, pricing, stock or images.' : 'Add a product to the catalogue.'
        }
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Products', to: '/admin/products' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Button to="/admin/products" variant="outline">
            Cancel
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-3" noValidate>
        <div className="space-y-5 lg:col-span-2">
          {form.submitError && (
            <Alert tone="error" title="Could not save this product">
              {form.submitError}
            </Alert>
          )}

          <section className="card p-5">
            <h2 className="text-base font-bold">Basic details</h2>

            <div className="mt-4 space-y-4">
              <Input
                label="Product name"
                required
                placeholder="Aether Pro Wireless Headphones"
                {...form.fieldProps('name')}
              />

              <Textarea
                label="Description"
                required
                rows={6}
                placeholder="Describe the product: what it does, what makes it good, key specifications…"
                hint={`${form.values.description.length} characters (minimum 10)`}
                {...form.fieldProps('description')}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Category" required {...form.fieldProps('category')}>
                  <option value="">Select a category</option>
                  {(categories.data?.categories ?? []).map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>

                <Input label="Brand" required placeholder="Aether" {...form.fieldProps('brand')} />
              </div>
            </div>
          </section>

          <section
            className={cn(
              'card p-5 transition-colors sm:p-6',
              dragging && 'border-brand-500 bg-brand-50/40 ring-4 ring-brand-500/15'
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Images</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Up to {MAX_IMAGES} images, 5MB each. The first image is the thumbnail. Uploads stream straight to Cloudinary.
                </p>
              </div>
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-600">{totalImages} / {MAX_IMAGES}</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {currentImages.map((image, index) => (
                <div key={image.publicId} className="group relative aspect-square overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 shadow-soft">
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                  {index === 0 && newFiles.length === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-night-400/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">Thumbnail</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.publicId)}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-night-400/75 p-1.5 text-white opacity-0 transition hover:bg-danger-600 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove image"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" /></svg>
                  </button>
                </div>
              ))}

              {previews.map((url, index) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-brand-400 bg-ink-100 shadow-glow-sm animate-scale-in">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">New</span>
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-night-400/75 p-1.5 text-white opacity-0 transition hover:bg-danger-600 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove image"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.3 5l3.7 3.7L13.7 5 15 6.3 11.3 10 15 13.7 13.7 15 10 11.3 6.3 15 5 13.7 8.7 10 5 6.3z" /></svg>
                  </button>
                </div>
              ))}

              {totalImages < MAX_IMAGES && (
                <label
                  className={cn(
                    'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-center transition-all',
                    dragging ? 'border-brand-500 bg-surface text-brand-600' : 'border-ink-300 text-ink-400 hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600'
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 transition group-hover:bg-brand-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></svg>
                  </span>
                  <span className="px-2 text-[11px] font-semibold leading-tight">{dragging ? 'Drop to add' : 'Upload or drop'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleFileChange} className="sr-only" />
                </label>
              )}
            </div>

            {totalImages === 0 && (
              <Alert tone="warning" className="mt-4">At least one image is required before you can save.</Alert>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-base font-bold">Pricing</h2>

            <div className="mt-4 space-y-4">
              <Input
                label="Original price"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="14999"
                {...form.fieldProps('price')}
              />

              <Input
                label="Discounted price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave empty for no discount"
                hint="Must be lower than the original price."
                {...form.fieldProps('discountPrice')}
              />

              {savingPercent > 0 && (
                <div className="rounded-xl bg-success-50 px-3.5 py-3">
                  <p className="text-sm font-semibold text-success-700">
                    {savingPercent}% off — customers pay {formatCurrency(discount)}
                  </p>
                  <p className="mt-0.5 text-xs text-success-600">
                    They save {formatCurrency(price - discount)} per unit.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Inventory</h2>

            <div className="mt-4 space-y-4">
              <Input
                label="Stock quantity"
                type="number"
                min="0"
                step="1"
                required
                placeholder="50"
                hint="Orders can never exceed this number."
                {...form.fieldProps('stock')}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Visibility</h2>

            <div className="mt-4 space-y-3.5">
              <Checkbox
                label="Feature on the homepage"
                description="Featured products appear in the hero section of the store."
                checked={Boolean(form.values.isFeatured)}
                onChange={(event) => form.setValue('isFeatured', event.target.checked)}
              />

              {isEdit && (
                <Checkbox
                  label="Active in the store"
                  description="Archived products stay in order history but disappear from the storefront."
                  checked={Boolean(form.values.isActive)}
                  onChange={(event) => form.setValue('isActive', event.target.checked)}
                />
              )}
            </div>
          </section>

          <div className="sticky bottom-4 space-y-2 rounded-2xl border border-ink-200/80 bg-surface/95 p-3 shadow-lift backdrop-blur">
            <Button type="submit" size="lg" fullWidth loading={form.submitting}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
            <Button to="/admin/products" variant="outline" fullWidth>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
