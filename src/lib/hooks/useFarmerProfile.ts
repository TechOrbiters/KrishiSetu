import { useState, useEffect, useCallback } from 'react';
import { fetchFarmerProfile, updateFarmerProfile } from '../api/client';
import { UserProfile } from '../seedData';

const EMPTY_PROFILE: UserProfile = {
  id: '',
  fullName: 'किसान साथी',
  fatherOrSpouseName: '',
  phone: '',
  dob: '',
  gender: 'पुरुष',
  role: 'FARMER_FPO',
  entityKind: 'farmer',
  verificationStatus: 'PENDING',
  aadhaarLast4: '',
  registrationDate: new Date().toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300',
  village: 'ग्राम बहरामघाट',
  postOffice: '',
  district: 'बाराबंकी',
  state: 'उत्तर प्रदेश',
  pincode: '225001',
};

export function useFarmerProfile() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchFarmerProfile();
    if (res.success && res.data) {
      setProfile(res.data.user);
    } else {
      setError(res.error || 'फसल प्रोफाइल लोड नहीं हो सकी');
    }
    setLoading(false);
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    const res = await updateFarmerProfile(updates);
    if (res.success && res.data) {
      setProfile((prev) => ({ ...prev, ...updates }));
    } else {
      setError(res.error || 'प्रोफाइल अपडेट असफल रहा');
    }
    setLoading(false);
    return res;
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, error, refetch, updateProfile };
}
