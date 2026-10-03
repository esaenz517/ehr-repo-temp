import { ProviderForm } from "./Providers/ProviderForm";
import { ProviderList } from "./Providers/ProviderList";
import { useProviders } from "../hooks/useProviders";

export function ProvidersPage() {
  const { providers, loading, error, create, remove } = useProviders();

  return (
    <div className="ui-page">
      <h1 className="ui-page-title">Providers</h1>

      <ProviderForm onSubmit={create} />

      {error && <p className="ui-error">{error}</p>}
      {loading ? <p className="ui-muted">Loading...</p> : <ProviderList providers={providers} onDelete={remove} />}
    </div>
  );
}
