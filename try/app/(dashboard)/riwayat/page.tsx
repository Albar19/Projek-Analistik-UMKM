'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import {
  MessageCircle,
  Trash2,
  ChevronRight,
  Clock,
  User,
  Bot,
  ArrowLeft,
  Copy,
  Download,
  Search,
  Sparkles,
} from 'lucide-react';

export default function RiwayatPage() {
  const { chatSessions, loadChatSession, deleteChatSession, setCurrentChatSession } = useStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSession = selectedSessionId
    ? chatSessions.find((s) => s.id === selectedSessionId)
    : null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLoadSession = (sessionId: string) => {
    loadChatSession(sessionId);
    setCurrentChatSession(sessionId);
    window.location.href = '/konsultasi';
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus sesi ini?')) {
      deleteChatSession(sessionId);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
    }
  };

  const handleCopySession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      const text = session.messages
        .map((msg) => `${msg.role === 'user' ? 'Anda' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      navigator.clipboard.writeText(text);
      alert('Percakapan disalin ke clipboard!');
    }
  };

  const handleDownloadSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      const text = session.messages
        .map((msg) => `${msg.role === 'user' ? 'Anda' : 'AI'}: ${msg.content}`)
        .join('\n\n');
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', `${session.title}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = chatSessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some((msg) =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📚 Riwayat Konsultasi</h1>
          <p className="text-slate-500 mt-1">
            {chatSessions.length} sesi percakapan tersimpan
          </p>
        </div>
      </div>

      {selectedSession ? (
        // Session Detail View
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedSessionId(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedSession.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedSession.createdAt)}
                  </span>
                  <span>{selectedSession.messages.length} pesan</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopySession(selectedSession.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadSession(selectedSession.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLoadSession(selectedSession.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Lanjutkan
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteSession(selectedSession.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {selectedSession.messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada pesan dalam sesi ini</p>
                </div>
              ) : (
                selectedSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : (
        // Sessions List View with Quick Questions Style
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari riwayat percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {chatSessions.length === 0 ? (
            <Card className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold text-slate-900 mb-1">Belum ada riwayat</h3>
              <p className="text-slate-500 mb-4">
                Mulai percakapan baru di menu Konsultasi untuk menyimpan riwayat
              </p>
              <Button onClick={() => (window.location.href = '/konsultasi')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Mulai Konsultasi
              </Button>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold text-slate-900 mb-1">Tidak ada hasil</h3>
              <p className="text-slate-500">
                Coba ubah pencarian Anda
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredSessions
                .slice()
                .reverse()
                .map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className="group w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(session.createdAt)}</span>
                          <span>•</span>
                          <span>{session.messages.length} pesan</span>
                        </div>
                        {session.messages.length > 0 && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2 group-hover:text-slate-700">
                            "{session.messages[0]?.content.substring(0, 60)}..."
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySession(session.id);
                          }}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Salin"
                        >
                          <Copy className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSession(session.id);
                          }}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
