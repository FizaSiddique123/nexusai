import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  Trash2,
  FileText,
  Eye,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { DocumentItem, DocumentSearchResult } from '../../../shared/src/types.js';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds 25MB limit.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      await api.uploadDocument(file);
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const results = await api.searchDocuments(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from your knowledge base?`)) {
      try {
        await api.deleteDocument(id);
        loadDocuments();
        if (selectedDoc?.id === id) setSelectedDoc(null);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleInspectDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      setSelectedDoc(data);
    } catch (err) {
      console.error('Failed to inspect document:', err);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Your knowledge
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Upload notes and documents so Nexus AI can answer questions using your own material.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${isDragging ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: isDragging ? 'var(--accent-surface)' : 'var(--bg-card)',
          marginBottom: '24px',
          transition: 'all 0.15s ease'
        }}
      >
        <Upload size={24} style={{ color: 'var(--accent-emerald)', margin: '0 auto 8px auto' }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {uploading ? 'Extracting and indexing document text...' : 'Drag and drop your notes here, or browse files'}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Supports PDF, TXT, and Markdown files up to 25MB
        </p>

        <label className="btn btn-secondary" style={{ marginTop: '12px', cursor: 'pointer', display: 'inline-flex' }}>
          <span>Browse file</span>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileInput}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        {uploadError && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.8rem', marginTop: '10px' }}>
            <AlertCircle size={14} />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="nexus-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across your notes (e.g. 'TCP handshake', 'OSPF Dijkstra', 'CIDR subnetting')..."
              style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
            />
          </div>
          <button type="submit" disabled={isSearching || !searchQuery.trim()} className="btn btn-secondary">
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <div style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Found {searchResults.length} relevant excerpts:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{r.filename}</span>
                    <span>Page {r.page_number}</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                    "{r.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clean Document List Table */}
      <div className="nexus-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Uploaded documents ({documents.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No documents uploaded yet. Add a PDF or text file to enable grounded answers.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <FileText size={18} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count || 1} passages indexed
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleInspectDoc(doc.id)}
                    className="btn-subtle"
                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    title="Inspect extracted passages"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    className="btn-danger"
                    style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passages Inspector Modal */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{selectedDoc.filename}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedDoc.chunks?.length || 0} indexed passages
                </p>
              </div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedDoc.chunks?.map((c: any, idx: number) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600, marginBottom: '2px' }}>
                    Passage #{c.chunk_index + 1} (Page {c.page_number})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
