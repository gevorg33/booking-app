import { IonLabel } from '@ionic/react';
import PhoneInputWithCountry, { type Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input.css';

interface ProviderPhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  defaultCountry: Country;
  label?: string;
}

export function ProviderPhoneInput({
  value,
  onChange,
  defaultCountry,
  label,
}: ProviderPhoneInputProps) {
  return (
    <div className="provider-phone-field">
      {label && <IonLabel className="provider-phone-label">{label}</IonLabel>}
      <PhoneInputWithCountry
        international
        defaultCountry={defaultCountry}
        addInternationalOption={false}
        countryCallingCodeEditable={false}
        value={value}
        onChange={(next) => onChange(next)}
        placeholder="Phone number"
      />
    </div>
  );
}
