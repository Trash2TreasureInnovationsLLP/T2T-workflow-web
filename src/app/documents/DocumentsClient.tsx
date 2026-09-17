"use client";

import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Search,
  Filter,
  Eye,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface DocumentsClientProps {
  initialDocuments: any[];
  projects: any[];
  currentUser: any;
}

export const DocumentsClient: React.FC<DocumentsClientProps> = ({
  initialDocuments,
  projects,
  currentUser,
}) => {
  const [docs, setDocs] = useState<any[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    fileName: "",
    category: "SPEC",
    projectId: "",
  });

  const filteredDocs = docs.filter((d) => {
    if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.project?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocs([newDoc, ...docs]);
        setUploadModalOpen(false);
        setForm({ title: "", fileName: "", category: "SPEC", projectId: "" });
      } else {
        alert("Failed to register document");
      }
    } catch (err) {
      alert("Error uploading document");
    } finally {
      setUploadLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>Company Document Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized technical repository for product specifications, ESG certifications, and compliance charters.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents by title, file name, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories ({docs.length})</option>
            <option value="SPEC">Specifications</option>
            <option value="PROPOSAL">Proposals</option>
            <option value="SPRINT">Sprint Artifacts</option>
            <option value="CONTRACT">Compliance & Contracts</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Associated Project</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">{d.title}</div>
                        <span className="font-mono text-[10px] text-slate-400">{d.fileName}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="brand">{d.category}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {d.project?.name || "Organization Wide"}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {formatFileSize(d.fileSize)}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {d.uploadedBy.fullName}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Document "${d.title}" is ready for secure download.`)}
                      className="px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg font-medium transition-colors"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Corporate Document"
        subtitle="Register technical specs, architecture diagrams, or audit reports."
        maxWidth="md"
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NIR Optical Sorting Calibration Benchmark v2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              File Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. nir_sorting_spec_v2.pdf"
              value={form.fileName}
              onChange={(e) => setForm({ ...form, fileName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="SPEC">Specification</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="SPRINT">Sprint Artifact</option>
                <option value="CONTRACT">Contract & ESG</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Associated Project
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">None (Organization Wide)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              {uploadLoading ? "Uploading..." : "Save Document"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
