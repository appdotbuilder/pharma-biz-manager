
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, ShoppingCart, X } from 'lucide-react';
import type { 
  SalesTransaction, 
  CreateSalesTransactionInput, 
  Product, 
  Customer 
} from '../../../server/src/schema';

interface SalesItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export function SalesTab() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const loadData = useCallback(async () => {
    try {
      const [transactionsResult, productsResult, customersResult] = await Promise.all([
        trpc.getSalesTransactions.query(),
        trpc.getProducts.query(),
        trpc.getCustomers.query()
      ]);
      
      setTransactions(transactionsResult);
      setProducts(productsResult);
      setCustomers(customersResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addSalesItem = () => {
    if (selectedProductId === 0 || quantity <= 0) return;

    const product = products.find((p: Product) => p.id === selectedProductId);
    if (!product) return;

    const existingItemIndex = salesItems.findIndex((item: SalesItem) => item.product_id === selectedProductId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newItems = [...salesItems];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity,
        subtotal: (newItems[existingItemIndex].quantity + quantity) * product.selling_price
      };
      setSalesItems(newItems);
    } else {
      // Add new item
      const newItem: SalesItem = {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.selling_price,
        subtotal: quantity * product.selling_price
      };
      setSalesItems((prev: SalesItem[]) => [...prev, newItem]);
    }

    setSelectedProductId(0);
    setQuantity(1);
  };

  const removeSalesItem = (productId: number) => {
    setSalesItems((prev: SalesItem[]) => prev.filter((item: SalesItem) => item.product_id !== productId));
  };

  const getTotalAmount = () => {
    return salesItems.reduce((total: number, item: SalesItem) => total + item.subtotal, 0);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salesItems.length === 0) return;

    setIsLoading(true);
    try {
      const transactionData: CreateSalesTransactionInput = {
        customer_id: selectedCustomerId,
        items: salesItems.map((item: SalesItem) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const response = await trpc.createSalesTransaction.mutate(transactionData);
      setTransactions((prev: SalesTransaction[]) => [...prev, response]);
      
      // Reset form
      setSelectedCustomerId(null);
      setSalesItems([]);
      setIsCreateDialogOpen(false);
      
      // Reload products to get updated stock
      loadData();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return 'Walk-in Customer';
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Sales Transactions ({transactions.length})
        </h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Record a new sales transaction.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction}>
              <div className="grid gap-6 py-4">
                {/* Customer Selection */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">
                    Customer
                  </Label>
                  <Select
                    value={selectedCustomerId?.toString() || 'none'}
                    onValueChange={(value: string) => 
                      setSelectedCustomerId(value === 'none' ? null : parseInt(value))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Walk-in Customer</SelectItem>
                      {customers.map((customer: Customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Products */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Add Products</h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="product">Product</Label>
                      <Select
                        value={selectedProductId.toString()}
                        onValueChange={(value: string) => setSelectedProductId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Select a product</SelectItem>
                          {products
                            .filter((p: Product) => p.current_stock > 0)
                            .map((product: Product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ${product.selling_price.toFixed(2)} (Stock: {product.current_stock})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setQuantity(parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <Button type="button" onClick={addSalesItem}>
                      Add
                    </Button>
                  </div>
                </div>

                {/* Sales Items */}
                {salesItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Items in Sale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesItems.map((item: SalesItem) => (
                            <TableRow key={item.product_id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSalesItem(item.product_id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} className="font-medium text-right">
                              Total Amount:
                            </TableCell>
                            <TableCell className="font-bold text-lg">
                              ${getTotalAmount().toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || salesItems.length === 0}
                >
                  {isLoading ? 'Processing...' : 'Complete Sale'}
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
              <TableHead>Transaction Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No sales transactions found. Record your first sale to get started! 🛒
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction: SalesTransaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {transaction.transaction_date.toLocaleDateString()}{' '}
                    {transaction.transaction_date.toLocaleTimeString()}
                  </TableCell>
                  <TableCell>{getCustomerName(transaction.customer_id)}</TableCell>
                  <TableCell className="font-medium">
                    ${transaction.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Completed</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
