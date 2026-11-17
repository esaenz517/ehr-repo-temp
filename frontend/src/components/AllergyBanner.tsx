import "../styles/allergyBanner.css";

interface Allergy {
  substance: string;
  reaction: string | null;
}

interface AllergyBannerProps {
  allergies: Allergy[];
}

// Strip shown to show allergies 

export function AllergyBanner({ allergies }: AllergyBannerProps) {
  if (allergies.length === 0) {
    return (
      <div className="allergy-banner allergy-banner--none" role="status">
        <strong className="allergy-banner__label">Allergies</strong>
        <span>No allergies on file. Verify with the patient.</span>
      </div>
    );
  }

  return (
    <div className="allergy-banner allergy-banner--alert" role="alert">
      <strong className="allergy-banner__label">
        ⚠ Allergies ({allergies.length})
      </strong>
      <ul className="allergy-banner__list">
        {allergies.map((a, i) => (
          <li key={i}>
            <strong>{a.substance}</strong>
            {a.reaction && <span> · {a.reaction}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}