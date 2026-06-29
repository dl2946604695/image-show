export const supabase = {
  from: () => ({
    select: async () => ({ data: null, error: new Error('Not used') }),
    insert: async () => ({ error: new Error('Not used') }),
    update: async () => ({ error: new Error('Not used') }),
  }),
  auth: {
    signInWithPassword: async () => ({ data: null, error: new Error('Not used') }),
    signUp: async () => ({ data: null, error: new Error('Not used') }),
    signOut: async () => {},
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ unsubscribe: () => {} }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: new Error('Not used') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } as const }),
    }),
  },
};