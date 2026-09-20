import React from "react";
import { Pressable, Text, View } from "@/tw";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "@/features/onboarding/styles/registrationStyles";
import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { Checkbox } from "./Checkbox";

type Messages = (typeof onboardingMessages)["en"];
type SelectOption = { label: string; value: string };

export interface RegistrationStepOneProps {
  messages: Messages;
  name: string;
  telephone: string;
  occupation: string;
  studentId: string;
  faculty: string;
  department: string;
  acceptedTerms: boolean;
  occupationOptions: SelectOption[];
  facultyOptions: SelectOption[];
  departmentOptions: SelectOption[];
  requiresStudentId: boolean;
  errors: Record<string, string>;
  onNameChange: (value: string) => void;
  onTelephoneChange: (value: string) => void;
  onOccupationChange: (value: string) => void;
  onStudentIdChange: (value: string) => void;
  onFacultyChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onAcceptedTermsChange: (value: boolean) => void;
  onReadPolicy: () => void;
}

export function RegistrationStepOne({
  messages: msg,
  name,
  telephone,
  occupation,
  studentId,
  faculty,
  department,
  acceptedTerms,
  occupationOptions,
  facultyOptions,
  departmentOptions,
  requiresStudentId,
  errors,
  onNameChange,
  onTelephoneChange,
  onOccupationChange,
  onStudentIdChange,
  onFacultyChange,
  onDepartmentChange,
  onAcceptedTermsChange,
  onReadPolicy,
}: RegistrationStepOneProps) {
  return (
    <>
      <Input
        label={msg.nameSurname}
        placeholder={msg.nameSurnamePlaceholder}
        value={name}
        onChangeText={onNameChange}
        error={errors.name}
      />
      <Input
        label={msg.telephone}
        placeholder={msg.telephonePlaceholder}
        value={telephone}
        onChangeText={onTelephoneChange}
        keyboardType="phone-pad"
        error={errors.telephone}
      />
      <Select
        label={msg.occupation}
        placeholder={msg.occupationPlaceholder}
        options={occupationOptions}
        searchable
        dropdown
        searchPlaceholder={msg.searchOccupation}
        noResultsMessage={msg.noSearchResults}
        emptyMessage={msg.noSelectOptions}
        loadingMessage={msg.loadingOptions}
        clearSearchLabel={msg.clearSearch}
        value={occupation}
        onValueChange={onOccupationChange}
        error={errors.occupation}
        closeLabel={msg.closeSelect}
      />
      {requiresStudentId && (
        <Input
          label={msg.studentId}
          placeholder={msg.studentIdPlaceholder}
          value={studentId}
          onChangeText={onStudentIdChange}
          error={errors.studentId}
        />
      )}
      <Select
        label={msg.faculty}
        placeholder={msg.facultyPlaceholder}
        options={facultyOptions}
        value={faculty}
        onValueChange={onFacultyChange}
        error={errors.faculty}
        searchable
        dropdown
        searchPlaceholder={msg.searchFaculty}
        noResultsMessage={msg.noSearchResults}
        emptyMessage={msg.noSelectOptions}
        loadingMessage={msg.loadingOptions}
        clearSearchLabel={msg.clearSearch}
        closeLabel={msg.closeSelect}
      />
      <Select
        label={msg.department}
        placeholder={
          faculty ? msg.departmentPlaceholder : msg.departmentSelectFacultyFirst
        }
        options={departmentOptions}
        value={department}
        onValueChange={onDepartmentChange}
        error={errors.department}
        searchable
        dropdown
        disabled={!faculty}
        searchPlaceholder={msg.searchDepartment}
        noResultsMessage={msg.noSearchResults}
        emptyMessage={msg.noSelectOptions}
        loadingMessage={msg.loadingOptions}
        clearSearchLabel={msg.clearSearch}
        closeLabel={msg.closeSelect}
      />
      <Text className={styles.termsLabel}>{msg.termsAndConditions}</Text>
      <View className={styles.policySummary}>
        <Text className={styles.policySummaryTitle}>{msg.privacyPolicy}</Text>
        <Text className={styles.policySummaryText}>{msg.privacySummary}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={msg.readFullPolicy}
          className={styles.policyReadAction}
          onPress={onReadPolicy}
        >
          <Text className={styles.policyReadActionText}>
            {msg.readFullPolicy}
          </Text>
        </Pressable>
      </View>
      <Checkbox
        label={msg.acceptTerms}
        checked={acceptedTerms}
        onChange={onAcceptedTermsChange}
        error={errors.acceptedTerms}
      />
    </>
  );
}
