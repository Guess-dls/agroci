export interface Country {
  code: string;
  name: string;
  phoneCode: string;
  flag: string;
}

export const countries: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", phoneCode: "+225", flag: "🇨🇮" },
  { code: "BF", name: "Burkina Faso", phoneCode: "+226", flag: "🇧🇫" },
  { code: "ML", name: "Mali", phoneCode: "+223", flag: "🇲🇱" },
  { code: "SN", name: "Sénégal", phoneCode: "+221", flag: "🇸🇳" },
  { code: "GH", name: "Ghana", phoneCode: "+233", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", phoneCode: "+234", flag: "🇳🇬" },
  { code: "BJ", name: "Bénin", phoneCode: "+229", flag: "🇧🇯" },
  { code: "TG", name: "Togo", phoneCode: "+228", flag: "🇹🇬" },
  { code: "NE", name: "Niger", phoneCode: "+227", flag: "🇳🇪" },
  { code: "GN", name: "Guinée", phoneCode: "+224", flag: "🇬🇳" },
  { code: "LR", name: "Liberia", phoneCode: "+231", flag: "🇱🇷" },
  { code: "SL", name: "Sierra Leone", phoneCode: "+232", flag: "🇸🇱" },
  { code: "GM", name: "Gambie", phoneCode: "+220", flag: "🇬🇲" },
  { code: "GW", name: "Guinée-Bissau", phoneCode: "+245", flag: "🇬🇼" },
  { code: "CV", name: "Cap-Vert", phoneCode: "+238", flag: "🇨🇻" },
  { code: "MR", name: "Mauritanie", phoneCode: "+222", flag: "🇲🇷" },
  { code: "CM", name: "Cameroun", phoneCode: "+237", flag: "🇨🇲" },
  { code: "CF", name: "République centrafricaine", phoneCode: "+236", flag: "🇨🇫" },
  { code: "TD", name: "Tchad", phoneCode: "+235", flag: "🇹🇩" },
  { code: "CG", name: "Congo", phoneCode: "+242", flag: "🇨🇬" },
  { code: "CD", name: "République démocratique du Congo", phoneCode: "+243", flag: "🇨🇩" },
  { code: "GA", name: "Gabon", phoneCode: "+241", flag: "🇬🇦" },
  { code: "GQ", name: "Guinée équatoriale", phoneCode: "+240", flag: "🇬🇶" },
  { code: "ST", name: "São Tomé-et-Principe", phoneCode: "+239", flag: "🇸🇹" },
  { code: "FR", name: "France", phoneCode: "+33", flag: "🇫🇷" },
  { code: "BE", name: "Belgique", phoneCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", phoneCode: "+41", flag: "🇨🇭" },
  { code: "CA", name: "Canada", phoneCode: "+1", flag: "🇨🇦" },
  { code: "US", name: "États-Unis", phoneCode: "+1", flag: "🇺🇸" },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryByName = (name: string): Country | undefined => {
  return countries.find(country => country.name === name);
};