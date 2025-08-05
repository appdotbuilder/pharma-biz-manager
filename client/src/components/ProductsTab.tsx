
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, AlertTriangle, Package } from 'lucide-react';
import type { Product, CreateProductInput, UpdateProductInput } from '../../../server/src/schema';

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateProductInput>({
    name: '',
    current_stock: 0,
    selling_price: 0,
    purchase_price: 0,
    expiration_date: new Date()
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateProductInput>>({});

  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createProduct.mutate(createFormData);
      setProducts((prev: Product[]) => [...prev, response]);
      setCreateFormData({
        name: '',
        current_stock: 0,
        selling_price: 0,
        purchase_price: 0,
        expiration_date: new Date()
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setIsLoading(true);
    try {
      const updateData = { id: editingProduct.id, ...editFormData };
      const response = await trpc.updateProduct.mutate(updateData);
      setProducts((prev: Product[]) => 
        prev.map((p: Product) => p.id === response.id ? response : p)
      );
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      current_stock: product.current_stock,
      selling_price: product.selling_price,
      purchase_price: product.purchase_price,
      expiration_date: product.expiration_date
    });
    setIsEditDialogOpen(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stock <= 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const isExpiringSoon = (expirationDate: Date) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expirationDate <= thirtyDaysFromNow;
  };

  const expiringSoonProducts = products.filter((product: Product) => 
    isExpiringSoon(product.expiration_date)
  );

  return (
    <div className="space-y-6">
      {expiringSoonProducts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{expiringSoonProducts.length} product(s) expiring within 30 days:</strong>{' '}
            {expiringSoonProducts.map((p: Product) => p.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Products & Medicines ({products.length})
        </h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the details for the new medicine or product.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={createFormData.current_stock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selling_price" className="text-right">
                    Selling Price
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={createFormData.selling_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purchase_price" className="text-right">
                    Purchase Price
                  </Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={createFormData.purchase_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))
                    }
                    className="col-span-3"
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expiration_date" className="text-right">
                    Expiration Date
                  </Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={createFormData.expiration_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateProductInput) => ({ ...prev, expiration_date: new Date(e.target.value) }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No products found. Add your first product to get started! 💊
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: Product) => {
                const stockStatus = getStockStatus(product.current_stock);
                const expiringSoon = isExpiringSoon(product.expiration_date);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.current_stock}</TableCell>
                    <TableCell>${product.selling_price.toFixed(2)}</TableCell>
                    <TableCell>${product.purchase_price.toFixed(2)}</TableCell>
                    <TableCell className={expiringSoon ? 'text-orange-600 font-medium' : ''}>
                      {product.expiration_date.toLocaleDateString()}
                      {expiringSoon && <AlertTriangle className="w-4 h-4 inline ml-1" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit_name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateProductInput>) => ({ ...prev, name: e.target.value }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="edit_stock"
                  type="number"
                  value={editFormData.current_stock || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateProductInput>) => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))
                  }
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_selling_price" className="text-right">
                  Selling Price
                </Label>
                <Input
                  id="edit_selling_price"
                  type="number"
                  step="0.01"
                  value={editFormData.selling_price || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateProductInput>) => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))
                  }
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_purchase_price" className="text-right">
                  Purchase Price
                </Label>
                <Input
                  id="edit_purchase_price"
                  type="number"
                  step="0.01"
                  value={editFormData.purchase_price || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateProductInput>) => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))
                  }
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_expiration_date" className="text-right">
                  Expiration Date
                </Label>
                <Input
                  id="edit_expiration_date"
                  type="date"
                  value={editFormData.expiration_date ? new Date(editFormData.expiration_date).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateProductInput>) => ({ ...prev, expiration_date: new Date(e.target.value) }))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
