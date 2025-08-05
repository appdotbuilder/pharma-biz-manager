
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, X, Stethoscope, User, Calendar } from 'lucide-react';
import type { 
  Prescription, 
  CreatePrescriptionInput, 
  Product 
} from '../../../server/src/schema';

interface PrescriptionMedicine {
  product_id: number;
  product_name: string;
  dosage: string;
  instructions: string | null;
}

export function PrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    patient_name: '',
    doctor_name: '',
    prescription_date: new Date()
  });

  const [prescriptionMedicines, setPrescriptionMedicines] = useState<PrescriptionMedicine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [prescriptionsResult, productsResult] = await Promise.all([
        trpc.getPrescriptions.query(),
        trpc.getProducts.query()
      ]);
      
      setPrescriptions(prescriptionsResult);
      setProducts(productsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addPrescriptionMedicine = () => {
    if (selectedProductId === 0 || !dosage.trim()) return;

    const product = products.find((p: Product) => p.id === selectedProductId);
    if (!product) return;

    const existingMedicine = prescriptionMedicines.find((med: PrescriptionMedicine) => med.product_id === selectedProductId);
    if (existingMedicine) return; // Don't add duplicates

    const newMedicine: PrescriptionMedicine = {
      product_id: product.id,
      product_name: product.name,
      dosage: dosage.trim(),
      instructions: instructions.trim() || null
    };

    setPrescriptionMedicines((prev: PrescriptionMedicine[]) => [...prev, newMedicine]);
    setSelectedProductId(0);
    setDosage('');
    setInstructions('');
  };

  const removePrescriptionMedicine = (productId: number) => {
    setPrescriptionMedicines((prev: PrescriptionMedicine[]) => 
      prev.filter((med: PrescriptionMedicine) => med.product_id !== productId)
    );
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prescriptionMedicines.length === 0 || !createFormData.patient_name.trim() || !createFormData.doctor_name.trim()) return;

    setIsLoading(true);
    try {
      const prescriptionData: CreatePrescriptionInput = {
        patient_name: createFormData.patient_name.trim(),
        doctor_name: createFormData.doctor_name.trim(),
        prescription_date: createFormData.prescription_date,
        medicines: prescriptionMedicines.map((med: PrescriptionMedicine) => ({
          product_id: med.product_id,
          dosage: med.dosage,
          instructions: med.instructions
        }))
      };

      const response = await trpc.createPrescription.mutate(prescriptionData);
      setPrescriptions((prev: Prescription[]) => [...prev, response]);
      
      // Reset form
      setCreateFormData({
        patient_name: '',
        doctor_name: '',
        prescription_date: new Date()
      });
      setPrescriptionMedicines([]);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create prescription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Prescriptions ({prescriptions.length})
        </h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-500 hover:bg-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Create a new prescription with patient details and medicines.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePrescription}>
              <div className="grid gap-6 py-4">
                {/* Patient and Doctor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_name" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient Name
                    </Label>
                    <Input
                      id="patient_name"
                      value={createFormData.patient_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev) => ({ ...prev, patient_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor_name" className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Doctor Name
                    </Label>
                    <Input
                      id="doctor_name"
                      value={createFormData.doctor_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev) => ({ ...prev, doctor_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prescription_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Prescription Date
                  </Label>
                  <Input
                    id="prescription_date"
                    type="date"
                    value={createFormData.prescription_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev) => ({ ...prev, prescription_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>

                {/* Add Medicines */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Add Medicines</h4>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="medicine">Medicine</Label>
                        <Select
                          value={selectedProductId.toString()}
                          onValueChange={(value: string) => setSelectedProductId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Select a medicine</SelectItem>
                            {products.map((product: Product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={dosage}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDosage(e.target.value)}
                          placeholder="e.g., 1 tablet twice daily"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="instructions">Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        value={instructions}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
                        placeholder="Additional instructions for the patient"
                        rows={2}
                      />
                    </div>
                    <Button type="button" onClick={addPrescriptionMedicine} className="w-fit">
                      Add Medicine
                    </Button>
                  </div>
                </div>

                {/* Prescription Medicines List */}
                {prescriptionMedicines.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Prescribed Medicines</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medicine</TableHead>
                            <TableHead>Dosage</TableHead>
                            <TableHead>Instructions</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {prescriptionMedicines.map((medicine: PrescriptionMedicine) => (
                            <TableRow key={medicine.product_id}>
                              <TableCell className="font-medium">{medicine.product_name}</TableCell>
                              <TableCell>{medicine.dosage}</TableCell>
                              <TableCell>{medicine.instructions || '-'}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePrescriptionMedicine(medicine.product_id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || prescriptionMedicines.length === 0 || !createFormData.patient_name.trim() || !createFormData.doctor_name.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Prescription'}
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
              <TableHead>Patient Name</TableHead>
              <TableHead>Doctor Name</TableHead>
              <TableHead>Prescription Date</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No prescriptions found. Create your first prescription to get started! 📋
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription: Prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {prescription.patient_name}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    {prescription.doctor_name}
                  </TableCell>
                  <TableCell>{prescription.prescription_date.toLocaleDateString()}</TableCell>
                  <TableCell>{prescription.created_at.toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
