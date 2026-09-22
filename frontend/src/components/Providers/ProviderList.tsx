import type { Provider } from "../../types";

interface ProviderListProps {
  providers: Provider[];
  onDelete: (providerId: number) => void;
}

export function ProviderList({ providers, onDelete }: ProviderListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {providers.map((provider) => (
        <li
          key={provider.provider_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>
              Dr. {provider.first_name} {provider.last_name}
            </strong>
            <div style={{ fontSize: 14, color: "#555" }}>
              {provider.specialty && <>{provider.specialty} · </>}
              {provider.phone && <>{provider.phone} · </>}
              {provider.email}
            </div>
          </div>
          <button onClick={() => onDelete(provider.provider_id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
