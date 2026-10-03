import type { Provider } from "../../types";

interface ProviderListProps {
  providers: Provider[];
  onDelete: (providerId: number) => void;
}

export function ProviderList({ providers, onDelete }: ProviderListProps) {
  if (providers.length === 0) {
    return <p className="ui-row-empty">No providers yet.</p>;
  }

  return (
    <ul className="ui-row-list">
      {providers.map((provider) => {
        // Only join the contact fields that are filled in, so there's no stray " · "
        const details = [provider.specialty, provider.phone, provider.email].filter(Boolean).join(" · ");

        return (
          <li key={provider.provider_id} className="ui-row">
            <div className="ui-row-main">
              <div className="ui-row-title">
                Dr. {provider.first_name} {provider.last_name}
              </div>
              {details && <div className="ui-row-subtitle">{details}</div>}
            </div>
            <div className="ui-row-actions">
              <button
                className="ui-button ui-button--danger"
                onClick={() => onDelete(provider.provider_id)}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
