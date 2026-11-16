import React from 'react';
import { Redirect } from 'expo-router';

export default function WordBankScreen() {
  return <Redirect href="/teacher/teacher-dashboard?tab=activities&view=wordbank" />;
}
