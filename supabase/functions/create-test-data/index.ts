import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string
  password: string
  full_name: string
  phone: string
  country: string
  entity_type?: string
  company_name?: string
  company_registration_number?: string
  company_pin?: string
  roles: string[]
  driver_data?: {
    license_number: string
    license_expiry: string
    ntsa_badge_number: string
    id_number: string
    is_vehicle_owner: boolean
  }
}

interface TestVehicle {
  owner_email: string
  model: string
  year: number
  type: string
  capacity: number
  registration_number: string
  daily_rate: number
  features: string[]
  status: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Define test users
    const testUsers: TestUser[] = [
      {
        email: 'info@safariadventures.co.ke',
        password: 'Test123!@#',
        full_name: 'Safari Adventures Ltd',
        phone: '+254722123456',
        country: 'Kenya',
        entity_type: 'company',
        company_name: 'Safari Adventures Ltd',
        company_registration_number: 'CPR/2018/123456',
        company_pin: 'P051234567A',
        roles: ['owner']
      },
      {
        email: 'james.kamau@kenyatours.co.ke',
        password: 'Test123!@#',
        full_name: 'James Kamau',
        phone: '+254733234567',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['owner']
      },
      {
        email: 'contact@expeditionsafrica.co.ke',
        password: 'Test123!@#',
        full_name: 'Expeditions Africa',
        phone: '+254744345678',
        country: 'Kenya',
        entity_type: 'company',
        company_name: 'Expeditions Africa',
        company_registration_number: 'CPR/2019/789012',
        company_pin: 'P051987654B',
        roles: ['owner']
      },
      {
        email: 'john.kariuki@example.com',
        password: 'Test123!@#',
        full_name: 'John Kariuki',
        phone: '+254755456789',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['driver'],
        driver_data: {
          license_number: 'DL/KE/12345678',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10001',
          id_number: '12345678',
          is_vehicle_owner: false
        }
      },
      {
        email: 'mary.wanjiru@example.com',
        password: 'Test123!@#',
        full_name: 'Mary Wanjiru',
        phone: '+254766567890',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['driver'],
        driver_data: {
          license_number: 'DL/KE/23456789',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10002',
          id_number: '23456789',
          is_vehicle_owner: false
        }
      },
      {
        email: 'peter.omondi@example.com',
        password: 'Test123!@#',
        full_name: 'Peter Omondi',
        phone: '+254777678901',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['driver'],
        driver_data: {
          license_number: 'DL/KE/34567890',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10003',
          id_number: '34567890',
          is_vehicle_owner: false
        }
      },
      {
        email: 'grace.akinyi@example.com',
        password: 'Test123!@#',
        full_name: 'Grace Akinyi',
        phone: '+254788789012',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['driver'],
        driver_data: {
          license_number: 'DL/KE/45678901',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10004',
          id_number: '45678901',
          is_vehicle_owner: false
        }
      },
      {
        email: 'david.mwangi@example.com',
        password: 'Test123!@#',
        full_name: 'David Mwangi',
        phone: '+254799890123',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['owner', 'driver'],
        driver_data: {
          license_number: 'DL/KE/56789012',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10005',
          id_number: '56789012',
          is_vehicle_owner: true
        }
      },
      {
        email: 'sarah.njeri@example.com',
        password: 'Test123!@#',
        full_name: 'Sarah Njeri',
        phone: '+254711901234',
        country: 'Kenya',
        entity_type: 'individual',
        roles: ['owner', 'driver'],
        driver_data: {
          license_number: 'DL/KE/67890123',
          license_expiry: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ntsa_badge_number: 'NTSA-10006',
          id_number: '67890123',
          is_vehicle_owner: true
        }
      }
    ]

    const userIdMap: Record<string, string> = {}

    // Create users
    for (const user of testUsers) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError)
        continue
      }

      const userId = authData.user.id
      userIdMap[user.email] = userId

      // Update profile
      await supabaseAdmin.from('profiles').update({
        phone: user.phone,
        country: user.country,
        entity_type: user.entity_type,
        company_name: user.company_name,
        company_registration_number: user.company_registration_number,
        company_pin: user.company_pin,
        account_status: 'active'
      }).eq('id', userId)

      // Add roles
      for (const role of user.roles) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: userId,
          role: role
        })
      }

      // Create driver record if needed
      if (user.driver_data) {
        await supabaseAdmin.from('drivers').insert({
          id: userId,
          license_number: user.driver_data.license_number,
          license_expiry: user.driver_data.license_expiry,
          ntsa_badge_number: user.driver_data.ntsa_badge_number,
          id_number: user.driver_data.id_number,
          ntsa_verified: true,
          is_compliant: true,
          status: 'available',
          is_vehicle_owner: user.driver_data.is_vehicle_owner
        })
      }
    }

    // Define test vehicles
    const testVehicles: TestVehicle[] = [
      {
        owner_email: 'info@safariadventures.co.ke',
        model: 'Toyota Land Cruiser V8',
        year: 2022,
        type: 'land_cruiser',
        capacity: 7,
        registration_number: 'KCB 123A',
        daily_rate: 15000,
        features: ['4WD', 'AC', 'GPS', 'Safari Roof', 'First Aid Kit', 'Fire Extinguisher'],
        status: 'available'
      },
      {
        owner_email: 'info@safariadventures.co.ke',
        model: 'Land Cruiser Prado VX',
        year: 2021,
        type: 'land_cruiser',
        capacity: 7,
        registration_number: 'KCC 456B',
        daily_rate: 14000,
        features: ['4WD', 'AC', 'GPS', 'Pop-up Roof', 'Cooler Box'],
        status: 'available'
      },
      {
        owner_email: 'info@safariadventures.co.ke',
        model: 'Nissan Civilian Tour Van',
        year: 2020,
        type: 'tour_van',
        capacity: 28,
        registration_number: 'KCD 789C',
        daily_rate: 12000,
        features: ['AC', 'PA System', 'Reclining Seats', 'WiFi'],
        status: 'booked'
      },
      {
        owner_email: 'info@safariadventures.co.ke',
        model: 'Isuzu FRR Bus',
        year: 2019,
        type: 'bus',
        capacity: 45,
        registration_number: 'KCE 012D',
        daily_rate: 18000,
        features: ['AC', 'PA System', 'Reclining Seats', 'Entertainment System', 'Toilet'],
        status: 'available'
      },
      {
        owner_email: 'james.kamau@kenyatours.co.ke',
        model: 'Toyota Land Cruiser 200',
        year: 2023,
        type: 'land_cruiser',
        capacity: 8,
        registration_number: 'KDA 345E',
        daily_rate: 16000,
        features: ['4WD', 'Leather Seats', 'AC', 'GPS', 'Safari Roof', 'Fridge'],
        status: 'available'
      },
      {
        owner_email: 'james.kamau@kenyatours.co.ke',
        model: 'Toyota Hiace Grand Cabin',
        year: 2021,
        type: 'tour_van',
        capacity: 14,
        registration_number: 'KDB 678F',
        daily_rate: 10000,
        features: ['AC', 'Reclining Seats', 'USB Charging', 'WiFi'],
        status: 'available'
      },
      {
        owner_email: 'james.kamau@kenyatours.co.ke',
        model: 'Nissan Caravan NV350',
        year: 2020,
        type: 'tour_van',
        capacity: 14,
        registration_number: 'KDC 901G',
        daily_rate: 9500,
        features: ['AC', 'Reclining Seats', 'GPS'],
        status: 'maintenance'
      },
      {
        owner_email: 'contact@expeditionsafrica.co.ke',
        model: 'Land Cruiser 79 Double Cab',
        year: 2024,
        type: 'land_cruiser',
        capacity: 7,
        registration_number: 'KEA 234H',
        daily_rate: 17000,
        features: ['4WD', 'AC', 'GPS', 'Pop-up Roof', 'Snorkel', 'Off-road Tires'],
        status: 'available'
      },
      {
        owner_email: 'contact@expeditionsafrica.co.ke',
        model: 'Scania K340 Bus',
        year: 2020,
        type: 'bus',
        capacity: 25,
        registration_number: 'KEB 567I',
        daily_rate: 20000,
        features: ['AC', 'PA System', 'Reclining Seats', 'Entertainment System', 'WiFi', 'USB Charging'],
        status: 'available'
      },
      {
        owner_email: 'contact@expeditionsafrica.co.ke',
        model: 'Toyota Prado TX-L',
        year: 2023,
        type: 'land_cruiser',
        capacity: 7,
        registration_number: 'KEC 890J',
        daily_rate: 14500,
        features: ['4WD', 'Leather Seats', 'AC', 'GPS', 'Sunroof'],
        status: 'booked'
      },
      {
        owner_email: 'david.mwangi@example.com',
        model: 'Land Cruiser TX',
        year: 2020,
        type: 'land_cruiser',
        capacity: 7,
        registration_number: 'KFA 123K',
        daily_rate: 13000,
        features: ['4WD', 'AC', 'GPS', 'Safari Roof'],
        status: 'available'
      },
      {
        owner_email: 'sarah.njeri@example.com',
        model: 'Toyota Hiace',
        year: 2021,
        type: 'tour_van',
        capacity: 14,
        registration_number: 'KFB 456L',
        daily_rate: 9000,
        features: ['AC', 'Reclining Seats', 'GPS'],
        status: 'available'
      }
    ]

    // Create vehicles
    const now = new Date()
    for (const vehicle of testVehicles) {
      const ownerId = userIdMap[vehicle.owner_email]
      if (!ownerId) continue

      await supabaseAdmin.from('vehicles').insert({
        owner_id: ownerId,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        capacity: vehicle.capacity,
        registration_number: vehicle.registration_number,
        daily_rate: vehicle.daily_rate,
        features: vehicle.features,
        status: vehicle.status,
        insurance_expiry: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        inspection_expiry: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        road_license_expiry: new Date(now.getTime() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tsv_psv_licence_expiry: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_compliant: true
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test data created successfully',
        users_created: testUsers.length,
        vehicles_created: testVehicles.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
