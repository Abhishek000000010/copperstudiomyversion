import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";

export function useCrmRecords(type, fallback = []) {
  const [records, setRecords] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiGet(`/api/crm/${type}`)
      .then((data) => {
        if (!alive) return;
        setRecords(data.length ? data : fallback);
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        setRecords(fallback);
        setError(err.message);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [type, fallback]);

  const actions = useMemo(() => ({
    async save(record) {
      const hasMongoId = Boolean(record._id);
      const saved = hasMongoId
        ? await apiPut(`/api/crm/${type}/${record._id}`, record)
        : await apiPost(`/api/crm/${type}`, record);

      setRecords((current) => {
        const exists = current.some((item) => item._id === saved._id || item.id === saved.id);
        if (!exists) return [saved, ...current];
        return current.map((item) => (item._id === saved._id || item.id === saved.id ? saved : item));
      });
      return saved;
    },
    async remove(record) {
      if (record._id) await apiDelete(`/api/crm/${type}/${record._id}`);
      setRecords((current) => current.filter((item) => item._id !== record._id && item.id !== record.id));
    },
    setRecords
  }), [type]);

  return { records, loading, error, ...actions };
}
