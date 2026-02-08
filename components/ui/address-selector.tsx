"use client";

import { useEffect, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressSelectorProps {
    value?: string;
    initialCountry?: string;
    initialState?: string;
    initialCity?: string;
    onChange: (value: string) => void;
    onStructuredChange?: (data: { address: string; city: string; state: string; country: string }) => void;
    error?: string;
}

export function AddressSelector({
    value,
    initialCountry,
    initialState,
    initialCity,
    onChange,
    onStructuredChange,
    error
}: AddressSelectorProps) {
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [addressLine, setAddressLine] = useState<string>('');

    // Initialize from props
    useEffect(() => {
        if (value) setAddressLine(value);

        if (initialCountry) {
            const countries = Country.getAllCountries();
            const country = countries.find(c =>
                c.name === initialCountry ||
                c.isoCode === initialCountry
            );

            if (country) {
                setSelectedCountry(country.isoCode);

                if (initialState) {
                    const states = State.getStatesOfCountry(country.isoCode);
                    const state = states.find(s => s.name === initialState || s.isoCode === initialState);

                    if (state) {
                        setSelectedState(state.isoCode);

                        if (initialCity) {
                            const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
                            const city = cities.find(c => c.name === initialCity);
                            setSelectedCity(city?.name || initialCity);
                        }
                    }
                }
            }
        }
    }, [value, initialCountry, initialState, initialCity]);

    const updateAddress = (line: string, city: string, stateCode: string, countryCode: string) => {
        const countryName = countryCode ? Country.getCountryByCode(countryCode)?.name : '';
        const stateName = stateCode && countryCode ? State.getStateByCodeAndCountry(stateCode, countryCode)?.name : '';

        const parts = [line, city, stateName, countryName].filter(Boolean);
        onChange(parts.join(', '));

        if (onStructuredChange) {
            onStructuredChange({
                address: line,
                city,
                state: stateName || '',
                country: countryName || ''
            });
        }
    };

    const handleCountryChange = (code: string) => {
        setSelectedCountry(code);
        setSelectedState('');
        setSelectedCity('');
        updateAddress(addressLine, '', '', code);
    };

    const handleStateChange = (code: string) => {
        setSelectedState(code);
        setSelectedCity('');
        updateAddress(addressLine, '', code, selectedCountry);
    };

    const handleCityChange = (name: string) => {
        setSelectedCity(name);
        updateAddress(addressLine, name, selectedState, selectedCountry);
    };

    const countries = Country.getAllCountries();
    const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
    const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : [];

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Street Address</Label>
                <Input
                    placeholder="Enter street address"
                    value={addressLine}
                    onChange={(e) => {
                        setAddressLine(e.target.value);
                        updateAddress(e.target.value, selectedCity, selectedState, selectedCountry);
                    }}
                    className={error ? "border-red-500" : ""}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Country</Label>
                    <Select
                        key={`country-${selectedCountry}`}
                        value={selectedCountry}
                        onValueChange={handleCountryChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Country">
                                {selectedCountry ? Country.getCountryByCode(selectedCountry)?.name : "Select Country"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {countries.map((country) => (
                                <SelectItem key={country.isoCode} value={country.isoCode}>
                                    {country.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">State/Province</Label>
                    <Select
                        key={`state-${selectedCountry}-${selectedState}`}
                        value={selectedState}
                        onValueChange={handleStateChange}
                        disabled={!selectedCountry}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select State">
                                {selectedState && selectedCountry ? State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name : "Select State"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {states.map((state) => (
                                <SelectItem key={state.isoCode} value={state.isoCode}>
                                    {state.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium">City</Label>
                {cities.length > 0 ? (
                    <Select
                        key={`city-${selectedCountry}-${selectedState}-${selectedCity}`}
                        value={selectedCity}
                        onValueChange={handleCityChange}
                        disabled={!selectedState}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select City">
                                {selectedCity || "Select City"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                    {city.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        placeholder="Enter City"
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!selectedCountry}
                    />
                )}
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
}
