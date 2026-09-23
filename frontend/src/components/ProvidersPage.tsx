import { ProviderForm } from "./Providers/ProviderForm";
import { ProviderList } from "./Providers/ProviderList";
import { useProviders } from "../hooks/useProviders";

export function ProvidersPage() {
  const { providers, loading, error, create, remove } = useProviders();

  return (
    <div>
      <h1>Providers</h1>

      <ProviderForm onSubmit={create} />

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? <p>Loading...</p> : <ProviderList providers={providers} onDelete={remove} />}
    </div>
  );
}
