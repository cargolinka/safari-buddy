import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CompanyDocument {
  id: string;
  company_id: string;
  document_type: string;
  file_path: string;
  uploaded_at: string;
  verified_at: string | null;
  verified_by_admin: boolean | null;
  company: {
    full_name: string;
    email: string;
    company_name: string;
    phone: string;
  };
}

const CompanyDocumentVerification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<CompanyDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all company documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["company-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_documents")
        .select(`
          *,
          company:profiles!company_documents_company_id_fkey(
            full_name,
            email,
            company_name,
            phone
          )
        `)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as CompanyDocument[];
    },
  });

  // Verify document mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ docId, approve }: { docId: string; approve: boolean }) => {
      const { error } = await supabase
        .from("company_documents")
        .update({
          verified_by_admin: approve,
          verified_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", docId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-documents"] });
      toast({
        title: variables.approve ? "Document Approved" : "Document Rejected",
        description: variables.approve 
          ? "The document has been verified and approved."
          : "The document has been rejected.",
      });
      setSelectedDoc(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Preview document
  const handlePreview = async (doc: CompanyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("company-documents")
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      
      setPreviewUrl(data.signedUrl);
      setSelectedDoc(doc);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive",
      });
    }
  };

  // Download document
  const handleDownload = async (doc: CompanyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("company-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_path.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const pendingDocs = documents?.filter((doc) => doc.verified_by_admin === null) || [];
  const approvedDocs = documents?.filter((doc) => doc.verified_by_admin === true) || [];
  const rejectedDocs = documents?.filter((doc) => doc.verified_by_admin === false) || [];

  const DocumentCard = ({ doc }: { doc: CompanyDocument }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{doc.company.company_name}</CardTitle>
            <CardDescription>
              {doc.company.full_name} • {doc.company.email}
            </CardDescription>
          </div>
          {doc.verified_by_admin === true && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          )}
          {doc.verified_by_admin === false && (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Rejected
            </Badge>
          )}
          {doc.verified_by_admin === null && (
            <Badge variant="secondary">Pending Review</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatDocumentType(doc.document_type)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
          </div>
          {doc.verified_at && (
            <div className="text-sm text-muted-foreground">
              Verified: {new Date(doc.verified_at).toLocaleDateString()}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview(doc)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(doc)}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            {doc.verified_by_admin === null && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => verifyMutation.mutate({ docId: doc.id, approve: true })}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => verifyMutation.mutate({ docId: doc.id, approve: false })}
                  disabled={verifyMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="p-8">Loading documents...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Document Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review and verify company registration documents
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingDocs.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedDocs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingDocs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No pending documents to review
              </CardContent>
            </Card>
          ) : (
            pendingDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedDocs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No approved documents
              </CardContent>
            </Card>
          ) : (
            approvedDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedDocs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No rejected documents
              </CardContent>
            </Card>
          ) : (
            rejectedDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDoc && formatDocumentType(selectedDoc.document_type)}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc?.company.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border rounded"
                title="Document Preview"
              />
            )}
          </div>
          {selectedDoc?.verified_by_admin === null && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="default"
                onClick={() => {
                  verifyMutation.mutate({ docId: selectedDoc.id, approve: true });
                  setShowPreview(false);
                }}
                disabled={verifyMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Document
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  verifyMutation.mutate({ docId: selectedDoc.id, approve: false });
                  setShowPreview(false);
                }}
                disabled={verifyMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Document
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDocumentVerification;
