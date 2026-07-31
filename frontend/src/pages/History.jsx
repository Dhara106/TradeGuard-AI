import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import API, { deleteShipment } from '../services/api'
import ShipmentTable from '../components/ShipmentTable'
import {
  EmptyState,
  InlineNotice,
  LoadingState,
  PageIntro,
} from '../components/ui'

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date created' },
  { value: 'weight', label: 'Cargo weight' },
  { value: 'riskScore', label: 'Risk coefficient' },
]

export default function History() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const requestVersion = useRef(0)

  const fetchShipments = useCallback(async () => {
    const version = ++requestVersion.current
    setLoading(true)
    setError('')

    try {
      const response = await API.get('/shipments', {
        params: {
          sort: sortKey,
          order: sortOrder,
        },
      })

      if (version !== requestVersion.current) return
      if (response.data?.success) {
        setShipments(response.data.data || [])
      } else {
        setError('The audit service returned an invalid response.')
      }
    } catch (requestError) {
      if (version !== requestVersion.current) return
      console.error('Error loading shipment history:', requestError)
      setError('We could not load your audit log. Check the services and try again.')
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [sortKey, sortOrder])

  useEffect(() => {
    fetchShipments()
    return () => {
      requestVersion.current += 1
    }
  }, [fetchShipments])

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return shipments

    return shipments.filter((shipment) => (
      String(shipment.origin || '').toLocaleLowerCase().includes(query)
      || String(shipment.destination || '').toLocaleLowerCase().includes(query)
      || String(shipment.carrier || '').toLocaleLowerCase().includes(query)
    ))
  }, [search, shipments])

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortOrder('asc')
  }

  const handleSortSelect = (event) => {
    const key = event.target.value
    if (key !== sortKey) {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Remove this shipment analysis from the audit log?')
    if (!confirmed) return

    try {
      setError('')
      const response = await deleteShipment(id)
      if (response.data?.success) {
        setShipments((current) => current.filter((shipment) => shipment._id !== id))
      } else {
        setError('The shipment could not be removed.')
      }
    } catch (requestError) {
      console.error('Error deleting shipment:', requestError)
      setError(requestError.response?.data?.message || 'The shipment could not be removed.')
    }
  }

  const hasSearch = Boolean(search.trim())
  const isInitialLoad = loading && shipments.length === 0

  return (
    <main className="history-page">
      <div className="app-page">
        <PageIntro
          eyebrow="Audit workspace"
          title="Shipment history"
          description="Search, sort, and review every delivery-risk analysis in one coherent record."
          action={(
            <button
              type="button"
              className="button button--secondary"
              onClick={fetchShipments}
              disabled={loading}
            >
              <ArrowsClockwise className={loading ? 'is-spinning' : undefined} />
              {loading ? 'Refreshing…' : 'Refresh records'}
            </button>
          )}
        />

        {error && <InlineNotice type="error">{error}</InlineNotice>}

        <section className="history-toolbar" aria-label="Audit log controls">
          <label className="search-field">
            <span className="sr-only">Search shipment history</span>
            <MagnifyingGlass aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search origin, destination, or carrier"
            />
          </label>

          <div className="history-sort">
            <label className="filter-field">
              <span>Sort by</span>
              <select value={sortKey} onChange={handleSortSelect}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button button--secondary history-sort__order"
              onClick={() => setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? <ArrowUp /> : <ArrowDown />}
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </section>

        <div className="history-summary" aria-live="polite">
          <strong>{filteredShipments.length}</strong>
          <span>
            {filteredShipments.length === 1 ? 'record' : 'records'}
            {hasSearch ? ` matching “${search.trim()}”` : ' in this audit log'}
          </span>
          {loading && shipments.length > 0 && <span className="history-summary__refresh">Refreshing…</span>}
        </div>

        {isInitialLoad ? (
          <LoadingState label="Running the audit query…" />
        ) : filteredShipments.length > 0 ? (
          <ShipmentTable
            shipments={filteredShipments}
            onDelete={handleDelete}
            showDelete
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
          />
        ) : shipments.length === 0 ? (
          <EmptyState
            title="No shipment records yet"
            description="Analyze a shipment and its prediction will automatically appear in this audit log."
            actionLabel="Analyze a shipment"
            actionTo="/predict"
          />
        ) : (
          <EmptyState
            title="No matching records"
            description="Try another route, destination, or carrier name."
            actionLabel="Clear search"
            onAction={() => setSearch('')}
          />
        )}
      </div>
    </main>
  )
}
