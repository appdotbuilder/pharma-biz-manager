
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductsTab } from '@/components/ProductsTab';
import { CustomersTab } from '@/components/CustomersTab';
import { SuppliersTab } from '@/components/SuppliersTab';
import { SalesTab } from '@/components/SalesTab';
import { PrescriptionsTab } from '@/components/PrescriptionsTab';
import { Package, Users, Truck, ShoppingCart, FileText } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            🏥 PharmaCare Management System
          </h1>
          <p className="text-blue-600 text-lg">
            Complete pharmacy business management solution
          </p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white shadow-md">
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="customers"
              className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger 
              value="suppliers"
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <Truck className="w-4 h-4" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger 
              value="sales"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger 
              value="prescriptions"
              className="flex items-center gap-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              Prescriptions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="shadow-lg">
              <CardHeader className="bg-blue-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Medicine & Product Management
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Manage your pharmacy inventory, track stock levels, and monitor expiration dates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ProductsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="shadow-lg">
              <CardHeader className="bg-green-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Management
                </CardTitle>
                <CardDescription className="text-green-100">
                  Manage customer information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CustomersTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <Card className="shadow-lg">
              <CardHeader className="bg-purple-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Supplier Management
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Manage supplier information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SuppliersTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="shadow-lg">
              <CardHeader className="bg-orange-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Sales Transactions
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Record sales transactions and manage customer purchases
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SalesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card className="shadow-lg">
              <CardHeader className="bg-pink-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Prescription Management
                </CardTitle>
                <CardDescription className="text-pink-100">
                  Manage prescriptions, track patient medications and dosages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PrescriptionsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
