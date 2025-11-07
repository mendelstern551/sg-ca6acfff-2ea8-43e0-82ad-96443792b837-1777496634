
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Download, Trash2, X } from "lucide-react";
import { contractService } from "@/services/contractService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Contract {
  id: string;
  booking_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  notes: string | null;
}

interface ContractUploadProps {
  bookingId: string;
  contracts: Contract[];
  onContractsUpdate: () => void;
}

export function ContractUpload({ bookingId, contracts, onContractsUpdate }: ContractUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (allow PDFs and common image formats)
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file (JPG, PNG).",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      await contractService.uploadContract(bookingId, selectedFile, notes);

      toast({
        title: "Contract Uploaded",
        description: "The signed contract has been uploaded successfully."
      });

      setSelectedFile(null);
      setNotes("");
      onContractsUpdate();
      
      // Reset file input
      const fileInput = document.getElementById("contract-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error uploading contract:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the contract. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (contract: Contract) => {
    try {
      const blob = await contractService.downloadContract(contract.file_path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your contract is being downloaded."
      });
    } catch (error) {
      console.error("Error downloading contract:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Are you sure you want to delete "${contract.file_name}"?`)) {
      return;
    }

    try {
      await contractService.deleteContract(contract.id, contract.file_path);
      toast({
        title: "Contract Deleted",
        description: "The contract has been removed successfully."
      });
      onContractsUpdate();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Signed Contracts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-3 p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="contract-file">Upload Signed Contract</Label>
            <div className="flex gap-2">
              <input
                id="contract-file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="flex-1 text-sm"
              />
              {selectedFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    const fileInput = document.getElementById("contract-file") as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Selected: {selectedFile.name} ({contractService.formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-notes">Notes (Optional)</Label>
            <Textarea
              id="contract-notes"
              placeholder="Add notes about this contract..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Contract
              </>
            )}
          </Button>
        </div>

        {/* Contracts List */}
        <div className="space-y-2">
          {contracts.length === 0 ? (
            <p className="text-center py-6 text-slate-500 text-sm">No contracts uploaded yet</p>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="font-medium text-sm truncate">{contract.file_name}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <span>{contractService.formatFileSize(contract.file_size)}</span>
                    <span>•</span>
                    <span>Uploaded {format(new Date(contract.uploaded_at), "MMM d, yyyy")}</span>
                  </div>
                  {contract.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{contract.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(contract)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contract)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
