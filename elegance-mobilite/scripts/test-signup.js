// Script de test pour l'inscription driver via l'API Supabase
// À exécuter dans la console du navigateur ou comme script Node.js

// Test 1: Créer un utilisateur driver avec l'API
async function testDriverSignup() {
  console.log('🔐 Test inscription driver...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-driver-' + Date.now() + '@example.com',
      password: 'password123',
      options: {
        data: {
          portal_type: 'driver',
          first_name: 'Test',
          last_name: 'Driver',
          full_name: 'Test Driver'
        }
      }
    });

    if (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      return;
    }

    console.log('✅ Utilisateur créé:', data.user?.email);
    console.log('📋 Métadonnées user:', data.user?.user_metadata);
    console.log('📋 Métadonnées app:', data.user?.app_metadata);
    
    // Vérifier le rôle assigné
    const role = data.user?.app_metadata?.role;
    if (role === 'app_driver') {
      console.log('✅ Rôle correctement assigné: app_driver');
    } else {
      console.log('❌ Rôle incorrect:', role, '(attendu: app_driver)');
    }
    
    return data.user;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Test 2: Créer un utilisateur customer pour comparaison
async function testCustomerSignup() {
  console.log('👤 Test inscription customer...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-customer-' + Date.now() + '@example.com',
      password: 'password123',
      options: {
        data: {
          portal_type: 'customer',
          first_name: 'Test',
          last_name: 'Customer',
          full_name: 'Test Customer'
        }
      }
    });

    if (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      return;
    }

    console.log('✅ Utilisateur créé:', data.user?.email);
    console.log('📋 Métadonnées user:', data.user?.user_metadata);
    console.log('📋 Métadonnées app:', data.user?.app_metadata);
    
    // Vérifier le rôle assigné
    const role = data.user?.app_metadata?.role;
    if (role === 'app_customer') {
      console.log('✅ Rôle correctement assigné: app_customer');
    } else {
      console.log('❌ Rôle incorrect:', role, '(attendu: app_customer)');
    }
    
    return data.user;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Test 3: Tester sans portal_type (doit échouer avec notre trigger corrigé)
async function testSignupWithoutPortalType() {
  console.log('🚫 Test inscription sans portal_type...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test-no-portal-' + Date.now() + '@example.com',
      password: 'password123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'NoPortal',
          full_name: 'Test NoPortal'
        }
      }
    });

    if (error) {
      console.log('✅ Erreur attendue:', error.message);
    } else {
      console.log('❌ L\'inscription a réussi alors qu\'elle devrait échouer');
      console.log('📋 Rôle assigné:', data.user?.app_metadata?.role);
    }
    
  } catch (error) {
    console.log('✅ Exception attendue:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🧪 Début des tests d\'inscription...\n');
  
  await testDriverSignup();
  console.log('\n---\n');
  
  await testCustomerSignup();
  console.log('\n---\n');
  
  await testSignupWithoutPortalType();
  console.log('\n🏁 Tests terminés');
}

// Exporter les fonctions pour utilisation
if (typeof window !== 'undefined') {
  // Dans le navigateur
  window.testDriverSignup = testDriverSignup;
  window.testCustomerSignup = testCustomerSignup;
  window.testSignupWithoutPortalType = testSignupWithoutPortalType;
  window.runAllTests = runAllTests;
  
  console.log('📋 Fonctions de test disponibles:');
  console.log('- testDriverSignup()');
  console.log('- testCustomerSignup()');
  console.log('- testSignupWithoutPortalType()');
  console.log('- runAllTests()');
}

// Pour Node.js
if (typeof module !== 'undefined') {
  module.exports = {
    testDriverSignup,
    testCustomerSignup,
    testSignupWithoutPortalType,
    runAllTests
  };
}
