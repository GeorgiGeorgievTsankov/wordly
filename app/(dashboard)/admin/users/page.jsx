'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Mail, Calendar, Award, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAdminUsersAction } from '@/lib/actions/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsersAction();
      if (!res.success) {
        setError(res.error || 'Failed to load user directory');
      } else {
        setUsers(res.users || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (u.display_name || '').toLowerCase();
    const uname = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || uname.includes(q) || email.includes(q);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Никога';
    try {
      return new Date(dateStr).toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Назад към Админ Панела</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Потребители
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {users.length} {users.length === 1 ? 'потребител' : 'потребителя'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Пълен списък на регистрираните потребители, техните имейли и напредък в ученето.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Обнови</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Търси по име, потребител или имейл..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-xs"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Зареждане на потребителите...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {searchQuery ? 'Няма намерени потребители по тази фраза' : 'Все още няма регистрирани потребители'}
          </p>
        </Card>
      ) : (
        /* Users Table / Cards */
        <Card className="overflow-hidden border-slate-200 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Потребител</th>
                  <th className="py-3.5 px-4 sm:px-6">Имейл</th>
                  <th className="py-3.5 px-4 sm:px-6">Роля</th>
                  <th className="py-3.5 px-4 sm:px-6">Научени думи</th>
                  <th className="py-3.5 px-4 sm:px-6">Регистрация</th>
                  <th className="py-3.5 px-4 sm:px-6">Последен вход</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const initial = (u.display_name || u.username || 'U').charAt(0).toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                              isAdmin
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {u.display_name || u.username}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              @{u.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs sm:text-sm select-all">{u.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 sm:px-6">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            Learner
                          </span>
                        )}
                      </td>

                      {/* Words Learned */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{u.words_learned || 0}</span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* Last Sign In */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 whitespace-nowrap">
                        <span>{formatDate(u.last_sign_in_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
