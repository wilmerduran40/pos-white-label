// Datos del Menú de Juos Burger
// Edita aquí para agregar/quitar productos o cambiar precios.
// - price: null significa "Consultar" (se muestra sin precio hasta definirlo).
// - variants: opciones de proteína/presentación que ajustan el precio.
// - img: reemplaza por la foto real de cada producto cuando la tengas.

const ADICIONALES = [
    { name: 'Chorizo', price: 2.00 },
    { name: 'Tocineta', price: 2.00 },
    { name: 'Cheddar', price: 2.00 },
    { name: 'Queso Amarillo', price: 1.50 },
    { name: 'Mozzarella', price: 1.50 },
    { name: 'Huevo', price: 1.00 },
    { name: 'Tajadas', price: 1.00 },
    { name: 'Aguacate', price: 1.00 },
    { name: 'Pollo', price: 2.50 },
    { name: 'Lomito', price: 3.00 },
    { name: 'Parmesano', price: 2.00 },
    { name: 'Croqueta', price: 3.00 },
    { name: 'Chuleta', price: 3.50 },
    { name: 'Tartara', price: 1.00 }
];

// Opciones SIN (quitar ingrediente) calculadas automáticamente desde la descripción
// de cada plato, más excepciones manuales por plato (removable / sinNo).
//
// Cómo funciona:
// - SALSAS: las hamburguesas y perros/costillas llevan estas salsas por defecto.
// - SIN_INGREDIENTES: diccionario de ingredientes removibles; si el nombre aparece
//   en la descripción del plato, se ofrece quitarlo sin costo.
// - p.removable: lista manual extra por plato (p. ej. 'Pan' en hamburguesas).
// - p.sinNo: ingredientes que NO se deben ofrecer aunque la descripción coincida.
// - Agrega aquí cualquier ingrediente nuevo y aparecerá en el SIN de los platos
//   cuya descripción lo mencione.

const SALSAS = ['Salsa de Tomate', 'Mostaza', 'Mayonesa', 'Salsa de la Casa'];

const SIN_INGREDIENTES = [
    { name: 'Papas de Perro', match: ['papas de perro'] },
    { name: 'Cheddar', match: ['cheddar'] },
    { name: 'Mozzarella', match: ['mozzarella'] },
    { name: 'Parmesano', match: ['parmesano', 'parmesana'] },
    { name: 'Queso de Mano', match: ['queso de mano'] },
    { name: 'Queso Frito', match: ['queso frito'] },
    { name: 'Queso Amarillo', match: ['queso amarillo'] },
    { name: 'Queso Americano', match: ['americano'] },
    { name: 'Tocineta', match: ['tocineta', 'tocino'] },
    { name: 'Aguacate', match: ['aguacate'] },
    { name: 'Huevo', match: ['huevo'] },
    { name: 'Maíz', match: ['maiz'] },
    { name: 'Chorizo', match: ['chorizo'] },
    { name: 'Tajadas', match: ['tajadas'] },
    { name: 'Lechuga', match: ['lechuga'] },
    { name: 'Cebolla', match: ['cebolla', 'cebollas'] },
    { name: 'Tomate', match: ['tomate'] },
    { name: 'Pepinillos', match: ['pepinillo'] },
    { name: 'Queso', match: ['queso'] },
    { name: 'Papas', match: ['papas'] },
    { name: 'Ensalada', match: ['ensalada'] }
];

// Categorías cuyos platos incluyen las salsas de la casa por defecto:
// solo a ellas se les ofrece quitarlas en el SIN.
const SIN_SALSAS_CATEGORIES = new Set(['hamburguesas', 'perros_costillas']);
const SIN_ESPECIFICOS = new Set(['Cheddar', 'Mozzarella', 'Parmesano', 'Queso de Mano', 'Queso Frito', 'Queso Amarillo', 'Queso Americano', 'Papas de Perro']);

function normTexto(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Devuelve la lista SIN de un plato: excepciones manuales (removable) +
// coincidencias automáticas de la descripción (aplican a TODAS las categorías)
// + salsas (solo en las categorías que las incluyen por defecto),
// menos las exclusiones (sinNo).
function sinOpciones(p) {
    const out = [];
    if (!p) return out;
    const push = (n) => { if (n && out.indexOf(n) === -1) out.push(n); };

    (p.removable || []).forEach(push);

    const desc = normTexto(p.desc);
    let quesoEspecifico = false;
    let papasDePerro = false;
    for (const ing of SIN_INGREDIENTES) {
        const found = ing.match.some((k) => desc.indexOf(k) !== -1);
        if (!found) continue;
        if (ing.name === 'Queso' && quesoEspecifico) continue;
        if (ing.name === 'Papas' && papasDePerro) continue;
        if (SIN_ESPECIFICOS.has(ing.name)) {
            if (ing.name === 'Papas de Perro') papasDePerro = true;
            else quesoEspecifico = true;
        }
        push(ing.name);
    }

    if (SIN_SALSAS_CATEGORIES.has(p.category) && p.salsas !== false) SALSAS.forEach(push);

    (p.sinNo || []).forEach((n) => { const i = out.indexOf(n); if (i !== -1) out.splice(i, 1); });
    return out;
}

let menuData = [

    // ============ HAMBURGUESAS ============
    {
        id: 'h1',
        name: 'Groserita',
        category: 'hamburguesas',
        price: 9.50,
        desc: 'Croqueta gratinada con queso mozzarella.',
        img: 'img/groserita.jpg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES,
        popular: true
    },
    {
        id: 'h2',
        name: 'Criollita',
        category: 'hamburguesas',
        price: 11.00,
        desc: 'Tajadas, cheddar, huevo y mozzarella.',
        img: 'img/criollita.jpg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES
    },

    {
        id: 'h3',
        name: 'Llanerita',
        category: 'hamburguesas',
        price: 11.00,
        desc: 'Aguacate, queso de mano y tocineta.',
        img: 'img/llanerita.jpg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1.00 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h4',
        name: 'Mixta',
        category: 'hamburguesas',
        price: 12.50,
        desc: 'Carne, pollo, tocineta, gratinado con mozzarella y maíz.',
        img: 'img/mixta.jpg',
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h5',
        name: 'Mixta Especial',
        category: 'hamburguesas',
        price: 13.50,
        desc: 'Chuleta, pollo gratinado con mozzarella y maíz.',
        img: 'img/mixtapolloychuleta.jpeg',
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h6',
        name: 'Tociqueso',
        category: 'hamburguesas',
        price: 12,
        desc: 'Proteína con baño de cheddar fundido y tocineta.',
        img: 'img/tociqueso.jpeg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1.00 },
            { label: 'Lomito', price: 2.00 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h7',
        name: 'Americana',
        category: 'hamburguesas',
        price: 11.00,
        desc: 'Tocineta y queso amarillo.',
        img: 'img/americana.jpg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1.00 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h8',
        name: 'Grosera Junior',
        category: 'hamburguesas',
        price: 13.00,
        desc: 'Chorizo, maíz, tocineta y queso amarillo. Peso: 600 g.',
        img: 'img/groserajunio.jpg',
        variants: [
            { label: 'Carne', price: 0 },
            { label: 'Pollo', price: 1.00 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h9',
        name: 'Grosera Mayor Mixta',
        category: 'hamburguesas',
        price: 16.00,
        desc: 'Doble proteína, chorizo, maíz, tocineta, queso amarillo y mozzarella. Peso: 800 g.',
        img: 'img/groseramayor.jpg',
        variants: [
            { label: 'Normal (Doble Proteína)', price: 0 },
            { label: 'Mixta', price: 2.00 }
        ],
        removable: ['Pan'],
        extras: ADICIONALES

        
    }
    ,
    {
        id: 'h10',
        name: 'Granjera Grosera',
        category: 'hamburguesas',
        price: 20.00,
        desc: 'Croqueta, pollo, chuleta, chorizo, tocineta, maíz, huevo, queso mozzarella y americano. Peso: 800 g.',
        img: 'img/granjeragrosera.jpg',
        removable: ['Pan'],
        extras: ADICIONALES
    },
    {
        id: 'h11',
        name: 'La Monstruosa',
        category: 'hamburguesas',
        price: 28.00,
        desc: '3 croquetas gratinadas con mozzarella, maíz, pollo gratinado con queso amarillo, tocineta y chorizo. Peso: 1 kg.',
        img: 'img/mostrosa.jpg',
        removable: ['Pan'],
        extras: ADICIONALES,
        popular: true
    },

    {
        id: 'h12',
        name: 'Mixta Keto',
        category: 'hamburguesas',
        price: 12.50,
        desc: 'Hamburguesa sin pan, con lechuga, pollo, chorizo, tocineta, maíz y queso mozzarella.',
        img: 'img/mixtaketo.jpg',
        removable: [],
        extras: ADICIONALES
    },

    // ============ PARRILLAS ============
    {
        id: 'p1',
        name: 'Parrilla Pequeña',
        category: 'parrillas',
        price: 15.00,
        desc: '250 g de lomito, chorizo, queso y maíz. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'p2',
        name: 'Parrilla Mediana',
        category: 'parrillas',
        price: 20.00,
        desc: '500 g de lomito, chorizo, queso y maíz. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: [],
        popular: true
    },
    {
        id: 'p3',
        name: 'Parrilla Mixta',
        category: 'parrillas',
        price: 25.00,
        desc: '500 g de lomito, chorizo, 200 g de pollo, queso y maíz. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'p4',
        name: 'Parrilla Familiar',
        category: 'parrillas',
        price: 36.00,
        desc: '1 kilo de lomito, chorizo x2, maíz, 200 g de pollo y queso. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'p5',
        name: 'Parrilla con Camarones Pequeña',
        category: 'parrillas',
        price: 22.00,
        desc: '250 g de lomito, chorizo, queso y maíz + 200 g de camarón. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/parrillacamaronpeq.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'p6',
        name: 'Parrilla con Camarones Mediana',
        category: 'parrillas',
        price: 27.00,
        desc: '500 g de lomito, chorizo, queso y maíz + 200 g de camarón. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/parrillacamaron.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'p7',
        name: 'Parrilla con Camarones Mixta',
        category: 'parrillas',
        price: 31.00,
        desc: '500 g de lomito, chorizo, 200 g de pollo, queso y maíz + 200 g de camarón. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/parillamixtacamaron.jpeg',
        removable: [],
        extras: []
    },
    {
        id: 'p8',
        name: 'Parrilla con Camarones Familiar',
        category: 'parrillas',
        price: 43.00,
        desc: '1 kilo de lomito, chorizo x2, maíz, 200 g de pollo y queso + 200 g de camarón. Incluye papas, ensalada mixta con aguacate o a la parmesana y salsa tártara.',
        img: 'img/parrillacamaron.jpg',
        removable: [],
        extras: []
    },

    // ============ PERROS Y COSTILLAS ============
    {
        id: 'pc1',
        name: 'Morochos Normales',
        category: 'perros_costillas',
        price: 11.50,
        desc: '2 perros calientes con salchichas jumbo, cebolla en mini cuadritos, papas de perro y queso parmesano.',
        img: 'img/morochosnorm.jpg',
        removable: ['Pan'],
        extras: []
    },
    {
        id: 'pc2',
        name: 'Morochos Groseros',
        category: 'perros_costillas',
        price: 18.50,
        desc: '2 perros calientes con salchichas jumbo, lomito, chorizo, cebollas en mini cuadritos, maíz, cheddar fundido y papas de perro. Acompañados de papas a la francesa.',
        img: 'img/perrocaliente.jpg',
        removable: ['Pan'],
        extras: [],
        popular: true
    },
    {
        id: 'pc3',
        name: 'Costillas BBQ (1/2)',
        category: 'perros_costillas',
        price: 14.00,
        desc: 'Costillas BBQ para 1 persona. Acompañadas de papas fritas y ensalada a la parmesana o mixta.',
        img: 'img/costillabqq.jpg',
        removable: [],
        sinNo: ['Parmesano'],
        extras: []
    },
    {
        id: 'pc4',
        name: 'Costillas BBQ (1)',
        category: 'perros_costillas',
        price: 25.00,
        desc: 'Costillas BBQ para 3 personas. Acompañadas de papas fritas y ensalada a la parmesana o mixta.',
        img: 'img/costillabqq.jpg',
        removable: [],
        sinNo: ['Parmesano'],
        extras: []
    },

    // ============ PLATOS ESPECIALES ============
    {
        id: 'e1',
        name: 'Salchipapas',
        category: 'especiales',
        price: 11.00,
        desc: 'Salchichas con papas fritas.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
     {
        id: 'e2',
        name: 'Salchipapas con Tocineta',
        category: 'especiales',
        price: 11.00,
        desc: 'Salchichas con papas fritas y tocineta.',
        img: 'img/salchipapatoci.jpeg',
        removable: [],
        extras: []
    },
    {
        id: 'e3',
        name: 'Salchipapas con Camarón',
        category: 'especiales',
        price: 11.00,
        desc: 'Salchichas con papas fritas , adicional de camarón.',
        img: 'img/salchipapacamaron.jpeg',
        removable: [],
        extras: [],
        
    },
    {
        id: 'e4',
        name: 'Choripapas',
        category: 'especiales',
        price: 12.50,
        desc: 'Chorizo con papas fritas.',
        img: 'img/choripapa.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'e5',
        name: 'Pollipapas',
        category: 'especiales',
        price: 12.50,
        desc: 'Pollo con papas fritas.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'e6',
        name: 'Pollo 3 Quesos',
        category: 'especiales',
        price: 14.00,
        desc: 'Pollo gratinado con 3 quesos.',
        img: 'img/pollo3quesos.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'e7',
        name: 'Patacón Maduro',
        category: 'especiales',
        price: 11.00,
        desc: 'Patacón de plátano maduro.',
        img: 'img/maduro.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'e8',
        name: 'Servicio Papas',
        category: 'especiales',
        price: 4.00,
        desc: 'Servicio de papas fritas.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },

    // ============ ENSALADAS Y KETO ============
    {
        id: 'ek1',
        name: 'Ensalada Parmesana',
        category: 'ensaladas_keto',
        price: 5.00,
        desc: 'Ensalada fresca con queso parmesano.',
        img: 'img/placeholder.svg',
        removable: [],
        sinNo: ['Ensalada'],
        extras: []
    },
    {
        id: 'ek2',
        name: 'Ensalada Mixta',
        category: 'ensaladas_keto',
        price: 5.00,
        desc: 'Ensalada mixta fresca.',
        img: 'img/placeholder.svg',
        removable: [],
        sinNo: ['Ensalada'],
        extras: []
    },
    {
        id: 'ek3',
        name: 'Ensalada Cesar con Pollo',
        category: 'ensaladas_keto',
        price: 12.00,
        desc: 'Lechuga, pollo, aderezo césar y parmesano.',
        img: 'img/cesarpollo.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'ek4',
        name: 'Ensalada Cesar con Camarones',
        category: 'ensaladas_keto',
        price: 16.00,
        desc: 'Lechuga, camarones, aderezo césar y parmesano.',
        img: 'img/cesarcamaron.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'ek5',
        name: 'Ensalada Cesar con Pollo y Camarones',
        category: 'ensaladas_keto',
        price: 19.00,
        desc: 'Lechuga, pollo, camarones, aderezo césar y parmesano.',
        img: 'img/cesarpollocamaron.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'ek6',
        name: 'Pollo Gratinado',
        category: 'ensaladas_keto',
        price: 14.00,
        desc: 'Pollo gratinado. Incluye ensalada, queso, aguacate, tocineta y huevo.',
        img: 'img/polloketo.jpeg',
        removable: [],
        extras: []
    },
    {
        id: 'ek7',
        name: 'Lomito Gratinado',
        category: 'ensaladas_keto',
        price: 16.00,
        desc: 'Lomito gratinado. Incluye ensalada, queso, aguacate, tocineta y huevo.',
        img: 'img/ketolomito.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'ek8',
        name: 'Camarones Gratinados',
        category: 'ensaladas_keto',
        price: 17.00,
        desc: 'Camarones gratinados. Incluye ensalada, queso, aguacate, tocineta y huevo.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },

    // ============ MARISQUERÍA ============
    {
        id: 'm1',
        name: 'Parrilla Mar y Tierra (Pequeña)',
        category: 'marisqueria',
        price: 62.00,
        desc: 'Lomito y mariscos a la parrilla.',
        img: 'img/marytierra.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm2',
        name: 'Parrilla Mar y Tierra (Grande)',
        category: 'marisqueria',
        price: 73.00,
        desc: 'Lomito y mariscos a la parrilla.',
        img: 'img/marytierra.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm3',
        name: 'Frutos del Mar (Pequeña)',
        category: 'marisqueria',
        price: 29.00,
        desc: 'Selección de frutos del mar.',
        img: 'img/frutosdelmar.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm4',
        name: 'Frutos del Mar (Grande)',
        category: 'marisqueria',
        price: 40.00,
        desc: 'Selección de frutos del mar.',
        img: 'img/frutosdelmar.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm5',
        name: 'Zarzuela',
        category: 'marisqueria',
        price: 30.00,
        desc: 'Zarzuela de mariscos.',
        img: 'img/zarzuela.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm6',
        name: 'Paella',
        category: 'marisqueria',
        price: 40.00,
        desc: 'Paella de mariscos.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm7',
        name: 'Pollo con Mariscos',
        category: 'marisqueria',
        price: 36.00,
        desc: 'Pollo acompañado de mariscos.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm8',
        name: 'Pollo con Camarones',
        category: 'marisqueria',
        price: 22.00,
        desc: 'Pollo acompañado de camarones.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm9',
        name: 'Pasta con Mariscos',
        category: 'marisqueria',
        price: 31.00,
        desc: 'Pasta con mariscos en salsa roja o salsa blanca.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm10',
        name: 'Pasta con Camarones',
        category: 'marisqueria',
        price: 19.00,
        desc: 'Pasta con camarones en salsa roja o salsa blanca.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm11',
        name: 'Pasta Juos',
        category: 'marisqueria',
        price: 24.00,
        desc: 'Camarones, tocineta, pollo, maíz y queso parmesano en salsa blanca.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: [],
        popular: true
    },
    {
        id: 'm12',
        name: 'Camarones al Ajillo',
        category: 'marisqueria',
        price: 16.00,
        desc: 'Camarones al ajillo. Acompañados de papas o pan al ajillo y salsa tártara.',
        img: 'img/camaronesajillo.jpeg',
        removable: [],
        extras: []
    },
    {
        id: 'm13',
        name: 'Camarones en Salsa de Queso',
        category: 'marisqueria',
        price: 19.00,
        desc: 'Camarones en salsa de queso. Acompañados de papas o pan al ajillo y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'm14',
        name: 'Camarones Rebosados',
        category: 'marisqueria',
        price: null,
        desc: 'Camarones rebosados. Acompañados de papas o pan al ajillo y salsa tártara.',
        img: 'img/camaronesreb.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'm15',
        name: 'Camarones Bechamel y Tocino',
        category: 'marisqueria',
        price: 19.00,
        desc: 'Camarones en bechamel con tocino. Acompañados de papas o pan al ajillo y salsa tártara.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
     {
        id: 'm16',
        name: 'Copa de Camarones',
        category: 'marisqueria',
        price: 19.00,
        desc: 'Copa de camarones. Acompañados de papas o pan al ajillo y salsa tártara, ensalada cesar.',
        img: 'img/copacamaron.jpeg',
        removable: [],
        extras: []
    },  

    // ============ BEBIDAS ============
    // --- Merengadas $5 ---
    {
        id: 'b1',
        name: 'Merengada de Fresa',
        category: 'bebidas',
        price: 5.00,
        desc: 'Merengada artesanal de fresa.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b2',
        name: 'Merengada de Oreo',
        category: 'bebidas',
        price: 5.00,
        desc: 'Merengada artesanal con galleta Oreo.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b3',
        name: 'Merengada Samba',
        category: 'bebidas',
        price: 5.00,
        desc: 'Merengada artesanal sabor a Samba.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b4',
        name: 'Merengada de Cocosette',
        category: 'bebidas',
        price: 5.00,
        desc: 'Merengada artesanal con Cocosette.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b5',
        name: 'Merengada de Parchita',
        category: 'bebidas',
        price: 5.00,
        desc: 'Merengada artesanal de parchita.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    // --- Merengadas $6 ---
    {
        id: 'b6',
        name: 'Merengada Toronto',
        category: 'bebidas',
        price: 6.00,
        desc: 'Merengada artesanal sabor Toronto.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b7',
        name: 'Merengada Flip',
        category: 'bebidas',
        price: 6.00,
        desc: 'Merengada artesanal sabor Flip.',
        img: 'img/merengadafliz.jpg',
        removable: [],
        extras: []
    },
    {
        id: 'b8',
        name: 'Merengada de Nutella',
        category: 'bebidas',
        price: 6.00,
        desc: 'Merengada artesanal con Nutella.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    // --- Jugos tipo Frozen $5 ---
    {
        id: 'b9',
        name: 'Frozen de Fresa',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jugo tipo frozen de fresa.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b10',
        name: 'Frozen de Melocotón',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jugo tipo frozen de melocotón.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b11',
        name: 'Frozen de Lechosa',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jugo tipo frozen de lechosa.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b12',
        name: 'Frozen de Melón',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jugo tipo frozen de melón.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b13',
        name: 'Frozen de Parchita',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jugo tipo frozen de parchita.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b14',
        name: 'Limonada',
        category: 'bebidas',
        price: 5.00,
        desc: 'Limonada tipo frozen bien fría.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b15',
        name: 'Jarra Nestea',
        category: 'bebidas',
        price: 5.00,
        desc: 'Jarra de Nestea fresca.',
        img: 'img/jarranestea.jpeg',
        removable: [],
        extras: []
    },

    {
        id: 'b16', 
        name: 'Vaso Nestea',
        category: 'bebidas',
        price: 1.00,
        desc: 'Vaso de Nestea Pequeño.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b17',
        name: 'Vaso Nestea Grande',
        category: 'bebidas',
        price: 2.00,
        desc: 'Vaso de Nestea Grande.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },  
    // --- Refrescos ---

    {
        id: 'b18',
        name: 'Coca-Cola',
        category: 'bebidas',
        price: 2.00,
        desc: 'Refresco de Coca-Cola Lata.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b19',
        name: 'Coca-Cola Zero',
        category: 'bebidas',
        price: 2.00,
        desc: 'Refresco de Coca-Cola Zero Lata.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b20',
        name: 'Coca-Cola 350ml',
        category: 'bebidas',
        price: 2.00,
        desc: 'Refresco de Coca-Cola 350ml.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },
    {
        id: 'b22',
        name: 'Coca Cola 1.5L',
        category: 'bebidas',
        price: 3.00,
        desc: 'Refresco de Coca-Cola 1.5L.',
        img: 'img/placeholder.svg',
        removable: [],
        extras: []
    },

    {
        id  : 'b21',
        name: 'Coca Cola 2L',
        category: 'bebidas',
        price: 4.00,
        desc: 'Refresco de Coca-Cola 2L.',
        img: 'img/cocacola1.5.jpg',
        removable: [],
        extras: []
    },

];