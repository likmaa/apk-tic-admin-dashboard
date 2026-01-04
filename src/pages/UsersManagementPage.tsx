import React, { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

type User = {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: 'admin' | 'developer' | 'driver' | 'passenger'
  is_active?: boolean | null
}

type Paged<T> = {
  data: T[]
  current_page: number
  per_page: number
  total: number
}

export default function UsersManagementPage() {
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paged, setPaged] = useState<Paged<User>>({ data: [], current_page: 1, per_page: 20, total: 0 })
  const { user: currentUser } = useAuth()

  const roles = useMemo(() => ['admin', 'developer', 'driver', 'passenger'], [])

  // Filter available roles for the select options
  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'developer') return roles
    return roles.filter(r => r !== 'developer')
  }, [currentUser, roles])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = { page }
      if (roleFilter) params.role = roleFilter
      if (q) params.q = q
      const r = await api.get<Paged<User>>('/api/admin/users', { params })
      setPaged(r.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const onSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const updateRole = async (u: User, newRole: User['role']) => {
    try {
      await api.patch(`/api/admin/users/${u.id}`, { role: newRole })
      setPaged((old) => ({
        ...old,
        data: old.data.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)),
      }))
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Impossible de mettre à jour le rôle')
    }
  }

  const deleteUser = async (u: User) => {
    const meStr = localStorage.getItem('admin_user')
    const me = meStr ? (JSON.parse(meStr) as { id: number }) : null
    if (me && me.id === u.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte.")
      return
    }
    if (!confirm(`Supprimer l'utilisateur #${u.id} (${u.name}) ?`)) return
    try {
      await api.delete(`/api/admin/users/${u.id}`)
      setPaged((old) => ({
        ...old,
        data: old.data.filter((x) => x.id !== u.id),
        total: Math.max(0, old.total - 1),
      }))
    } catch (e: any) {
      alert(e?.response?.data?.message || "Suppression impossible")
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Utilisateurs</h2>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher nom / email / téléphone"
          className="px-3 py-2 border rounded-md text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={onSearch}
          className="px-3 py-2 bg-primary text-white rounded-md text-sm"
          disabled={loading}
        >
          Rechercher
        </button>
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">ID</th>
              <th className="text-left px-4 py-2">Nom</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Téléphone</th>
              <th className="text-left px-4 py-2">Rôle</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.data.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.id}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email || '-'}</td>
                <td className="px-4 py-2">{u.phone || '-'}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u, e.target.value as User['role'])}
                    className="px-2 py-1 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={u.role === 'developer' && currentUser?.role !== 'developer'}
                    title={u.role === 'developer' && currentUser?.role !== 'developer' ? "Seul un développeur peut modifier un compte développeur" : ""}
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    {/* Ensure current role is visible even if not in availableRoles (for dev accounts viewed by admins) */}
                    {!availableRoles.includes(u.role) && (
                      <option value={u.role}>{u.role}</option>
                    )}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => deleteUser(u)}
                    className="px-2 py-1 text-white bg-red-500 hover:bg-red-600 rounded-md text-xs"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {!loading && paged.data.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Aucun utilisateur</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 border rounded-md"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          Précédent
        </button>
        <div className="text-sm text-gray-600">Page {paged.current_page}</div>
        <button
          className="px-3 py-2 border rounded-md"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || paged.data.length < paged.per_page}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
