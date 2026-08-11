export const CURVE_Z_MARGIN = 0.2

export const RAREFACTION = {
  MIN_SAMPLES: 90,
  MAX_SAMPLES: 180,
  SAMPLES_PER_RESOLUTION: 3,
  COMPOSITE_MIN_SAMPLES: 1200,
  COMPOSITE_SAMPLES_MULTIPLIER: 5,
  COMPOSITE_SAMPLES_PER_RESOLUTION: 36,
}

export const HUGONIOT = {
  MIN_SAMPLES: 420,
  MAX_SAMPLES: 920,
  SAMPLES_PER_RESOLUTION: 11,
  ADAPTIVE_INITIAL_DIVISOR: 3.2,
  ADAPTIVE_MAX_DEPTH: 10,
  ADAPTIVE_TOLERANCE: 0.0045,
  ADAPTIVE_SPEED_TOLERANCE: 0.006,
  ADAPTIVE_MAX_POINTS_FACTOR: 7,
  ADAPTIVE_MAX_POINTS_MIN: 1800,
  ADAPTIVE_MAX_POINTS_MAX: 7200,
  SOLUTION_MIN_SAMPLES: 520,
  SOLUTION_MAX_SAMPLES: 1100,
  SOLUTION_SAMPLES_PER_RESOLUTION: 13,
  SATURATED_BASE_POINTS: 300,
  SATURATED_Z_MIN_SAMPLES: 52,
  SATURATED_Z_MAX_SAMPLES: 96,
  SATURATED_Z_SAMPLES_PER_RESOLUTION: 1.35,
  Z_EXTENSION_MARGIN: 1.2,
}

export const COMPOSITE = {
  CONTINUATION_STEP: 0.0018,
  MAX_STEPS: 12000,
  MAX_JUMP: 0.14,
  BASE_RAREFACTION_SAMPLES: 1400,
  BASE_RAREFACTION_MIN_DISTANCE: 1e-8,
  DRAW_MAX_POINTS: 1800,
  DRAW_SPLIT_JUMP_MIN: 0.08,
  DRAW_SPLIT_JUMP_FACTOR: 8.0,
  DRAW_MAX_EDGE_LENGTH: 0.022,
  DRAW_SMOOTH_MIN_POINTS: 24,
  DRAW_SMOOTH_SAMPLES_PER_EDGE: 10,
  DRAW_SMOOTH_TENSION: 0.35,
  U_MARGIN: 0.40,
  // Margem visual/parametrica da composta.
  // U/W controlam o dominio normalizado do marching-squares.
  W_MARGIN: 0.75,

  // A curva composta continua limitada no eixo z pelo calcView (+20%).
  // Esta margem e apenas da folha de Hugoniot que satura a rarefacao:
  // ela precisa ser maior para a folha conseguir alcançar a sonica.
  HUGONIOT_SATURATION_ETA_MARGIN_FACTOR: 2.5,

  // A superficie saturada usa uma malha adaptada para evitar pontos esparsos
  // perto de eta=0 (z≈0 na folha de Hugoniot).
  SATURATED_SURFACE_ETA_CLUSTER_FRACTION: 1.10,
  // Potencia menor = densificacao menos pontual e mais espalhada ao redor de eta=0.
  // Isso aumenta a faixa suave perto de z=0 sem aumentar demais o custo.
  SATURATED_SURFACE_ETA_CLUSTER_POWER: 2.15,
  SATURATED_SURFACE_U_CLUSTER_FRACTION: 0.35,

  // Mantido como compatibilidade para codigo antigo que ainda consulte ETA_MARGIN_FACTOR.
  ETA_MARGIN_FACTOR: 1.0,
  GLOBAL_LEVELSET_U_SAMPLES: 320,
  GLOBAL_LEVELSET_W_SAMPLES: 480,
  GLOBAL_LEVELSET_VALUE_CAP: 1e8,
}

export const SONIC_SURFACE = {
  // Densifica a malha das superficies sonicas sem adicionar aramado visual.
  // A resolucao maior deixa os ramos S_s/S_f e a fronteira branca mais suaves.
  MIN_RESOLUTION: 112,
  MAX_RESOLUTION: 176,
  RESOLUTION_MULTIPLIER: 2.85,
  SEPARATOR_SAMPLES: 1400,
  Z_CLUSTER_FRACTION: 0.78,
  Z_CLUSTER_POWER: 2.6,
}


export function clampResolutionSamples(value, min, max) {
  return Math.max(min, Math.min(max, value))
}



