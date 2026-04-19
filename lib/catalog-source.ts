export type CatalogSourceCategory = {
  heading: string;
  label: string;
  enumValue:
    | "PRODUCE"
    | "MEAT_AND_SEAFOOD"
    | "DAIRY_AND_EGGS"
    | "BAKERY"
    | "PANTRY"
    | "SNACKS_AND_SWEETS"
    | "DRINKS"
    | "CLOTHING_AND_FOOTWEAR"
    | "SCHOOL_STATIONERY_AND_TOYS"
    | "PERSONAL_CARE_AND_HEALTH"
    | "CLEANING_AND_HOUSEHOLD"
    | "KITCHEN_AND_DINING"
    | "BABY"
    | "PET"
    | "TECH_ELECTRONICS_AND_APPLIANCES";
  expectedCount: number;
  items: Array<{ name: string; unitLabel: string }>;
};

export const CATALOG_SOURCE: CatalogSourceCategory[] = [
  {
    "enumValue": "PRODUCE",
    "label": "Produce",
    "heading": "PRODUCE",
    "expectedCount": 122,
    "items": [
      {
        "name": "green apples",
        "unitLabel": "/kg"
      },
      {
        "name": "red apples",
        "unitLabel": "/kg"
      },
      {
        "name": "pink lady apples",
        "unitLabel": "/kg"
      },
      {
        "name": "granny smith apples",
        "unitLabel": "/kg"
      },
      {
        "name": "bananas",
        "unitLabel": "/kg"
      },
      {
        "name": "organic bananas",
        "unitLabel": "/kg"
      },
      {
        "name": "mini bananas",
        "unitLabel": "/kg"
      },
      {
        "name": "navel oranges",
        "unitLabel": "/kg"
      },
      {
        "name": "valencia oranges",
        "unitLabel": "/kg"
      },
      {
        "name": "blood oranges",
        "unitLabel": "/kg"
      },
      {
        "name": "mandarins",
        "unitLabel": "/kg"
      },
      {
        "name": "imperial mandarins",
        "unitLabel": "/kg"
      },
      {
        "name": "lemons",
        "unitLabel": "/kg"
      },
      {
        "name": "limes",
        "unitLabel": "/kg"
      },
      {
        "name": "green grapes",
        "unitLabel": "/kg"
      },
      {
        "name": "red grapes",
        "unitLabel": "/kg"
      },
      {
        "name": "black grapes",
        "unitLabel": "/kg"
      },
      {
        "name": "seedless grapes",
        "unitLabel": "/kg"
      },
      {
        "name": "strawberries",
        "unitLabel": "per punnet"
      },
      {
        "name": "organic strawberries",
        "unitLabel": "per punnet"
      },
      {
        "name": "blueberries",
        "unitLabel": "per punnet"
      },
      {
        "name": "raspberries",
        "unitLabel": "per punnet"
      },
      {
        "name": "blackberries",
        "unitLabel": "per punnet"
      },
      {
        "name": "watermelon",
        "unitLabel": "/kg"
      },
      {
        "name": "cut watermelon",
        "unitLabel": "per pack"
      },
      {
        "name": "mini watermelon",
        "unitLabel": "/kg"
      },
      {
        "name": "rockmelon",
        "unitLabel": "each"
      },
      {
        "name": "cut rockmelon",
        "unitLabel": "per pack"
      },
      {
        "name": "pineapple",
        "unitLabel": "each"
      },
      {
        "name": "sliced pineapple",
        "unitLabel": "per pack"
      },
      {
        "name": "mango",
        "unitLabel": "each"
      },
      {
        "name": "green mango",
        "unitLabel": "each"
      },
      {
        "name": "sliced mango",
        "unitLabel": "per pack"
      },
      {
        "name": "kiwifruit",
        "unitLabel": "/kg"
      },
      {
        "name": "gold kiwifruit",
        "unitLabel": "/kg"
      },
      {
        "name": "peaches",
        "unitLabel": "/kg"
      },
      {
        "name": "white peaches",
        "unitLabel": "/kg"
      },
      {
        "name": "nectarines",
        "unitLabel": "/kg"
      },
      {
        "name": "white nectarines",
        "unitLabel": "/kg"
      },
      {
        "name": "plums",
        "unitLabel": "/kg"
      },
      {
        "name": "black plums",
        "unitLabel": "/kg"
      },
      {
        "name": "pears",
        "unitLabel": "/kg"
      },
      {
        "name": "brown pears",
        "unitLabel": "/kg"
      },
      {
        "name": "hass avocados",
        "unitLabel": "each"
      },
      {
        "name": "large avocados",
        "unitLabel": "each"
      },
      {
        "name": "ripe avocados",
        "unitLabel": "each"
      },
      {
        "name": "cherries",
        "unitLabel": "/kg"
      },
      {
        "name": "lychees",
        "unitLabel": "/kg"
      },
      {
        "name": "dragon fruit",
        "unitLabel": "each"
      },
      {
        "name": "coconut",
        "unitLabel": "each"
      },
      {
        "name": "passionfruit",
        "unitLabel": "each"
      },
      {
        "name": "papaya",
        "unitLabel": "each"
      },
      {
        "name": "dates",
        "unitLabel": "per pack"
      },
      {
        "name": "dried apricots",
        "unitLabel": "per pack"
      },
      {
        "name": "raisins",
        "unitLabel": "per pack"
      },
      {
        "name": "potatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "red potatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "baby potatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "sweet potatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "purple sweet potatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "carrots",
        "unitLabel": "/kg"
      },
      {
        "name": "baby carrots",
        "unitLabel": "per 1kg bag"
      },
      {
        "name": "organic carrots",
        "unitLabel": "/kg"
      },
      {
        "name": "brown onions",
        "unitLabel": "/kg"
      },
      {
        "name": "red onions",
        "unitLabel": "/kg"
      },
      {
        "name": "spring onions",
        "unitLabel": "per bunch"
      },
      {
        "name": "garlic",
        "unitLabel": "each"
      },
      {
        "name": "peeled garlic",
        "unitLabel": "per pack"
      },
      {
        "name": "ginger",
        "unitLabel": "/kg"
      },
      {
        "name": "broccoli",
        "unitLabel": "each"
      },
      {
        "name": "broccoli florets",
        "unitLabel": "per pack"
      },
      {
        "name": "cauliflower",
        "unitLabel": "each"
      },
      {
        "name": "cauliflower florets",
        "unitLabel": "per pack"
      },
      {
        "name": "cabbage",
        "unitLabel": "each"
      },
      {
        "name": "red cabbage",
        "unitLabel": "each"
      },
      {
        "name": "iceberg lettuce",
        "unitLabel": "each"
      },
      {
        "name": "cos lettuce",
        "unitLabel": "each"
      },
      {
        "name": "mixed lettuce",
        "unitLabel": "per bag"
      },
      {
        "name": "spinach",
        "unitLabel": "per bag"
      },
      {
        "name": "baby spinach",
        "unitLabel": "per bag"
      },
      {
        "name": "kale",
        "unitLabel": "per bunch"
      },
      {
        "name": "baby kale",
        "unitLabel": "per bag"
      },
      {
        "name": "zucchini",
        "unitLabel": "/kg"
      },
      {
        "name": "yellow zucchini",
        "unitLabel": "/kg"
      },
      {
        "name": "eggplant",
        "unitLabel": "/kg"
      },
      {
        "name": "baby eggplant",
        "unitLabel": "/kg"
      },
      {
        "name": "red capsicum",
        "unitLabel": "/kg"
      },
      {
        "name": "green capsicum",
        "unitLabel": "/kg"
      },
      {
        "name": "yellow capsicum",
        "unitLabel": "/kg"
      },
      {
        "name": "roma tomatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "cherry tomatoes",
        "unitLabel": "per punnet"
      },
      {
        "name": "vine tomatoes",
        "unitLabel": "/kg"
      },
      {
        "name": "continental cucumber",
        "unitLabel": "each"
      },
      {
        "name": "lebanese cucumber",
        "unitLabel": "/kg"
      },
      {
        "name": "pumpkin",
        "unitLabel": "/kg"
      },
      {
        "name": "cut pumpkin",
        "unitLabel": "per pack"
      },
      {
        "name": "corn cobs",
        "unitLabel": "each"
      },
      {
        "name": "green beans",
        "unitLabel": "/kg"
      },
      {
        "name": "trimmed beans",
        "unitLabel": "/kg"
      },
      {
        "name": "peas",
        "unitLabel": "/kg"
      },
      {
        "name": "frozen peas",
        "unitLabel": "per 500g bag"
      },
      {
        "name": "mushrooms",
        "unitLabel": "per punnet"
      },
      {
        "name": "portobello mushrooms",
        "unitLabel": "per punnet"
      },
      {
        "name": "sliced mushrooms",
        "unitLabel": "per pack"
      },
      {
        "name": "celery",
        "unitLabel": "each"
      },
      {
        "name": "leeks",
        "unitLabel": "each"
      },
      {
        "name": "radishes",
        "unitLabel": "per bunch"
      },
      {
        "name": "beetroot",
        "unitLabel": "per bunch"
      },
      {
        "name": "parsnips",
        "unitLabel": "/kg"
      },
      {
        "name": "turnips",
        "unitLabel": "/kg"
      },
      {
        "name": "brussels sprouts",
        "unitLabel": "/kg"
      },
      {
        "name": "snow peas",
        "unitLabel": "/kg"
      },
      {
        "name": "bok choy",
        "unitLabel": "each"
      },
      {
        "name": "choy sum",
        "unitLabel": "per bunch"
      },
      {
        "name": "fresh herbs mix",
        "unitLabel": "per bunch"
      },
      {
        "name": "coriander",
        "unitLabel": "per bunch"
      },
      {
        "name": "parsley",
        "unitLabel": "per bunch"
      },
      {
        "name": "mint",
        "unitLabel": "per bunch"
      },
      {
        "name": "basil",
        "unitLabel": "per bunch"
      },
      {
        "name": "chilli red",
        "unitLabel": "/kg"
      },
      {
        "name": "chilli green",
        "unitLabel": "/kg"
      },
      {
        "name": "bean sprouts",
        "unitLabel": "per bag"
      }
    ]
  },
  {
    "enumValue": "MEAT_AND_SEAFOOD",
    "label": "Meat & Seafood",
    "heading": "MEAT & SEAFOOD",
    "expectedCount": 53,
    "items": [
      {
        "name": "skinless chicken breast",
        "unitLabel": "/kg"
      },
      {
        "name": "marinated chicken breast",
        "unitLabel": "/kg"
      },
      {
        "name": "boneless chicken thighs",
        "unitLabel": "/kg"
      },
      {
        "name": "marinated chicken thighs",
        "unitLabel": "/kg"
      },
      {
        "name": "chicken drumsticks",
        "unitLabel": "/kg"
      },
      {
        "name": "chicken wings",
        "unitLabel": "/kg"
      },
      {
        "name": "raw whole chicken",
        "unitLabel": "/kg"
      },
      {
        "name": "cooked whole chicken",
        "unitLabel": "each"
      },
      {
        "name": "beef mince",
        "unitLabel": "/kg"
      },
      {
        "name": "lean beef mince",
        "unitLabel": "/kg"
      },
      {
        "name": "premium beef mince",
        "unitLabel": "/kg"
      },
      {
        "name": "ribeye steak",
        "unitLabel": "/kg"
      },
      {
        "name": "sirloin steak",
        "unitLabel": "/kg"
      },
      {
        "name": "scotch fillet steak",
        "unitLabel": "/kg"
      },
      {
        "name": "t-bone steak",
        "unitLabel": "/kg"
      },
      {
        "name": "porterhouse steak",
        "unitLabel": "/kg"
      },
      {
        "name": "beef sausages",
        "unitLabel": "/kg"
      },
      {
        "name": "beef burger patties",
        "unitLabel": "per pack"
      },
      {
        "name": "corned beef",
        "unitLabel": "/kg"
      },
      {
        "name": "lamb chops forequarter",
        "unitLabel": "/kg"
      },
      {
        "name": "lamb chops loin",
        "unitLabel": "/kg"
      },
      {
        "name": "lamb leg whole",
        "unitLabel": "/kg"
      },
      {
        "name": "lamb leg half",
        "unitLabel": "/kg"
      },
      {
        "name": "lamb mince",
        "unitLabel": "/kg"
      },
      {
        "name": "pork chops bone-in",
        "unitLabel": "/kg"
      },
      {
        "name": "pork chops boneless",
        "unitLabel": "/kg"
      },
      {
        "name": "pork mince",
        "unitLabel": "/kg"
      },
      {
        "name": "pork belly slices",
        "unitLabel": "/kg"
      },
      {
        "name": "bacon short cut",
        "unitLabel": "/kg"
      },
      {
        "name": "bacon streaky",
        "unitLabel": "/kg"
      },
      {
        "name": "ham slices smoked",
        "unitLabel": "per 100g"
      },
      {
        "name": "ham slices honey",
        "unitLabel": "per 100g"
      },
      {
        "name": "salami mild",
        "unitLabel": "per 100g"
      },
      {
        "name": "salami spicy",
        "unitLabel": "per 100g"
      },
      {
        "name": "chorizo",
        "unitLabel": "each"
      },
      {
        "name": "turkey slices",
        "unitLabel": "per 100g"
      },
      {
        "name": "roast beef slices",
        "unitLabel": "per 100g"
      },
      {
        "name": "canned tuna in oil",
        "unitLabel": "per can"
      },
      {
        "name": "canned tuna in springwater",
        "unitLabel": "per can"
      },
      {
        "name": "fresh salmon fillet",
        "unitLabel": "/kg"
      },
      {
        "name": "salmon portions",
        "unitLabel": "/kg"
      },
      {
        "name": "fresh barramundi fillets",
        "unitLabel": "/kg"
      },
      {
        "name": "fresh basa fillets",
        "unitLabel": "/kg"
      },
      {
        "name": "fresh flathead fillets",
        "unitLabel": "/kg"
      },
      {
        "name": "fresh fish fillets",
        "unitLabel": "/kg"
      },
      {
        "name": "crumbed fish fillets",
        "unitLabel": "per pack"
      },
      {
        "name": "battered fish fillets",
        "unitLabel": "per pack"
      },
      {
        "name": "raw prawns whole",
        "unitLabel": "/kg"
      },
      {
        "name": "raw prawns peeled",
        "unitLabel": "/kg"
      },
      {
        "name": "cooked prawns",
        "unitLabel": "/kg"
      },
      {
        "name": "mussels",
        "unitLabel": "per pack"
      },
      {
        "name": "squid rings",
        "unitLabel": "per pack"
      },
      {
        "name": "seafood sticks",
        "unitLabel": "per pack"
      }
    ]
  },
  {
    "enumValue": "DAIRY_AND_EGGS",
    "label": "Dairy & Eggs",
    "heading": "DAIRY & EGGS",
    "expectedCount": 35,
    "items": [
      {
        "name": "full cream milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "full cream milk 2L",
        "unitLabel": "each"
      },
      {
        "name": "skim milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "skim milk 2L",
        "unitLabel": "each"
      },
      {
        "name": "lactose free milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "almond milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "soy milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "oat milk 1L",
        "unitLabel": "each"
      },
      {
        "name": "chocolate milk small",
        "unitLabel": "each"
      },
      {
        "name": "chocolate milk large",
        "unitLabel": "each"
      },
      {
        "name": "cheddar sliced",
        "unitLabel": "per pack"
      },
      {
        "name": "cheddar block",
        "unitLabel": "/kg"
      },
      {
        "name": "mozzarella shredded",
        "unitLabel": "per pack"
      },
      {
        "name": "mozzarella block",
        "unitLabel": "/kg"
      },
      {
        "name": "parmesan grated",
        "unitLabel": "per pack"
      },
      {
        "name": "parmesan block",
        "unitLabel": "/kg"
      },
      {
        "name": "tasty cheese block",
        "unitLabel": "/kg"
      },
      {
        "name": "cream cheese tub",
        "unitLabel": "each"
      },
      {
        "name": "feta cheese",
        "unitLabel": "per pack"
      },
      {
        "name": "ricotta tub",
        "unitLabel": "each"
      },
      {
        "name": "plain yogurt tub",
        "unitLabel": "each"
      },
      {
        "name": "greek yogurt tub",
        "unitLabel": "each"
      },
      {
        "name": "flavoured yogurt tub",
        "unitLabel": "each"
      },
      {
        "name": "single serve yogurt",
        "unitLabel": "each"
      },
      {
        "name": "butter salted 500g",
        "unitLabel": "each"
      },
      {
        "name": "butter unsalted 500g",
        "unitLabel": "each"
      },
      {
        "name": "margarine tub",
        "unitLabel": "each"
      },
      {
        "name": "light margarine tub",
        "unitLabel": "each"
      },
      {
        "name": "thickened cream 300mL",
        "unitLabel": "each"
      },
      {
        "name": "thickened cream 600mL",
        "unitLabel": "each"
      },
      {
        "name": "sour cream tub",
        "unitLabel": "each"
      },
      {
        "name": "custard tub",
        "unitLabel": "each"
      },
      {
        "name": "cage eggs dozen",
        "unitLabel": "each"
      },
      {
        "name": "free-range eggs dozen",
        "unitLabel": "each"
      },
      {
        "name": "organic eggs dozen",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "BAKERY",
    "label": "Bakery",
    "heading": "BAKERY",
    "expectedCount": 35,
    "items": [
      {
        "name": "white bread loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "thick white bread loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "wholemeal bread loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "thick wholemeal bread loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "multigrain bread loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "sourdough loaf",
        "unitLabel": "per loaf"
      },
      {
        "name": "turkish bread loaf",
        "unitLabel": "each"
      },
      {
        "name": "bread rolls white",
        "unitLabel": "per pack"
      },
      {
        "name": "bread rolls wholemeal",
        "unitLabel": "per pack"
      },
      {
        "name": "burger buns sesame",
        "unitLabel": "per pack"
      },
      {
        "name": "burger buns plain",
        "unitLabel": "per pack"
      },
      {
        "name": "hot dog rolls",
        "unitLabel": "per pack"
      },
      {
        "name": "tortilla wraps white",
        "unitLabel": "per pack"
      },
      {
        "name": "tortilla wraps wholemeal",
        "unitLabel": "per pack"
      },
      {
        "name": "naan bread",
        "unitLabel": "per pack"
      },
      {
        "name": "croissants",
        "unitLabel": "per pack"
      },
      {
        "name": "mini croissants",
        "unitLabel": "per pack"
      },
      {
        "name": "muffins chocolate",
        "unitLabel": "per pack"
      },
      {
        "name": "muffins blueberry",
        "unitLabel": "per pack"
      },
      {
        "name": "cupcakes vanilla",
        "unitLabel": "per pack"
      },
      {
        "name": "cupcakes chocolate",
        "unitLabel": "per pack"
      },
      {
        "name": "sponge cake plain",
        "unitLabel": "each"
      },
      {
        "name": "cream sponge cake",
        "unitLabel": "each"
      },
      {
        "name": "banana bread loaf",
        "unitLabel": "each"
      },
      {
        "name": "meat pies",
        "unitLabel": "each"
      },
      {
        "name": "chunky beef pies",
        "unitLabel": "each"
      },
      {
        "name": "sausage rolls mini",
        "unitLabel": "per pack"
      },
      {
        "name": "sausage rolls large",
        "unitLabel": "each"
      },
      {
        "name": "garlic bread",
        "unitLabel": "each"
      },
      {
        "name": "bagels plain",
        "unitLabel": "per pack"
      },
      {
        "name": "bagels blueberry",
        "unitLabel": "per pack"
      },
      {
        "name": "crumpets",
        "unitLabel": "per pack"
      },
      {
        "name": "english muffins",
        "unitLabel": "per pack"
      },
      {
        "name": "pita bread",
        "unitLabel": "per pack"
      },
      {
        "name": "pizza base two pack",
        "unitLabel": "per pack"
      }
    ]
  },
  {
    "enumValue": "PANTRY",
    "label": "Pantry",
    "heading": "PANTRY",
    "expectedCount": 76,
    "items": [
      {
        "name": "white rice long grain",
        "unitLabel": "/kg"
      },
      {
        "name": "jasmine rice",
        "unitLabel": "/kg"
      },
      {
        "name": "basmati rice",
        "unitLabel": "/kg"
      },
      {
        "name": "brown rice",
        "unitLabel": "/kg"
      },
      {
        "name": "quick cook brown rice",
        "unitLabel": "/kg"
      },
      {
        "name": "penne pasta",
        "unitLabel": "per 500g"
      },
      {
        "name": "fusilli pasta",
        "unitLabel": "per 500g"
      },
      {
        "name": "macaroni pasta",
        "unitLabel": "per 500g"
      },
      {
        "name": "spaghetti",
        "unitLabel": "per 500g"
      },
      {
        "name": "wholemeal spaghetti",
        "unitLabel": "per 500g"
      },
      {
        "name": "lasagne sheets",
        "unitLabel": "per box"
      },
      {
        "name": "instant noodles chicken",
        "unitLabel": "each"
      },
      {
        "name": "instant noodles beef",
        "unitLabel": "each"
      },
      {
        "name": "cup noodles",
        "unitLabel": "each"
      },
      {
        "name": "plain flour",
        "unitLabel": "/kg"
      },
      {
        "name": "self-raising flour",
        "unitLabel": "/kg"
      },
      {
        "name": "wholemeal flour",
        "unitLabel": "/kg"
      },
      {
        "name": "corn flour",
        "unitLabel": "per pack"
      },
      {
        "name": "white sugar",
        "unitLabel": "/kg"
      },
      {
        "name": "caster sugar",
        "unitLabel": "/kg"
      },
      {
        "name": "brown sugar light",
        "unitLabel": "/kg"
      },
      {
        "name": "brown sugar dark",
        "unitLabel": "/kg"
      },
      {
        "name": "icing sugar",
        "unitLabel": "/kg"
      },
      {
        "name": "table salt",
        "unitLabel": "each"
      },
      {
        "name": "iodised salt",
        "unitLabel": "each"
      },
      {
        "name": "sea salt grinder",
        "unitLabel": "each"
      },
      {
        "name": "black pepper ground",
        "unitLabel": "each"
      },
      {
        "name": "black pepper cracked",
        "unitLabel": "each"
      },
      {
        "name": "rolled oats quick",
        "unitLabel": "/kg"
      },
      {
        "name": "rolled oats traditional",
        "unitLabel": "/kg"
      },
      {
        "name": "cornflakes",
        "unitLabel": "per box"
      },
      {
        "name": "large cornflakes box",
        "unitLabel": "per box"
      },
      {
        "name": "muesli fruit",
        "unitLabel": "per box"
      },
      {
        "name": "muesli nut",
        "unitLabel": "per box"
      },
      {
        "name": "coco cereal",
        "unitLabel": "per box"
      },
      {
        "name": "weet style biscuits",
        "unitLabel": "per box"
      },
      {
        "name": "baked beans can",
        "unitLabel": "each"
      },
      {
        "name": "reduced salt baked beans can",
        "unitLabel": "each"
      },
      {
        "name": "canned tomatoes diced",
        "unitLabel": "each"
      },
      {
        "name": "canned tomatoes crushed",
        "unitLabel": "each"
      },
      {
        "name": "canned corn whole",
        "unitLabel": "each"
      },
      {
        "name": "canned corn creamed",
        "unitLabel": "each"
      },
      {
        "name": "canned chickpeas",
        "unitLabel": "each"
      },
      {
        "name": "canned lentils",
        "unitLabel": "each"
      },
      {
        "name": "canned coconut milk",
        "unitLabel": "each"
      },
      {
        "name": "passata bottle",
        "unitLabel": "each"
      },
      {
        "name": "tomato paste tube",
        "unitLabel": "each"
      },
      {
        "name": "instant soup chicken",
        "unitLabel": "per pack"
      },
      {
        "name": "instant soup vegetable",
        "unitLabel": "per pack"
      },
      {
        "name": "stock cubes chicken",
        "unitLabel": "per pack"
      },
      {
        "name": "stock cubes beef",
        "unitLabel": "per pack"
      },
      {
        "name": "peanut butter smooth",
        "unitLabel": "per jar"
      },
      {
        "name": "peanut butter crunchy",
        "unitLabel": "per jar"
      },
      {
        "name": "jam strawberry",
        "unitLabel": "per jar"
      },
      {
        "name": "jam raspberry",
        "unitLabel": "per jar"
      },
      {
        "name": "honey raw",
        "unitLabel": "per jar"
      },
      {
        "name": "honey organic",
        "unitLabel": "per jar"
      },
      {
        "name": "olive oil regular",
        "unitLabel": "per bottle"
      },
      {
        "name": "olive oil extra virgin",
        "unitLabel": "per bottle"
      },
      {
        "name": "vegetable oil",
        "unitLabel": "per bottle"
      },
      {
        "name": "sesame oil",
        "unitLabel": "per bottle"
      },
      {
        "name": "soy sauce light",
        "unitLabel": "per bottle"
      },
      {
        "name": "soy sauce dark",
        "unitLabel": "per bottle"
      },
      {
        "name": "oyster sauce",
        "unitLabel": "per bottle"
      },
      {
        "name": "fish sauce",
        "unitLabel": "per bottle"
      },
      {
        "name": "tomato sauce",
        "unitLabel": "per bottle"
      },
      {
        "name": "ketchup",
        "unitLabel": "per bottle"
      },
      {
        "name": "bbq sauce",
        "unitLabel": "per bottle"
      },
      {
        "name": "hot sauce",
        "unitLabel": "per bottle"
      },
      {
        "name": "mayonnaise",
        "unitLabel": "per jar"
      },
      {
        "name": "mustard yellow",
        "unitLabel": "per bottle"
      },
      {
        "name": "mustard dijon",
        "unitLabel": "per jar"
      },
      {
        "name": "salad dressing caesar",
        "unitLabel": "per bottle"
      },
      {
        "name": "salad dressing italian",
        "unitLabel": "per bottle"
      },
      {
        "name": "white vinegar",
        "unitLabel": "per bottle"
      },
      {
        "name": "apple cider vinegar",
        "unitLabel": "per bottle"
      }
    ]
  },
  {
    "enumValue": "SNACKS_AND_SWEETS",
    "label": "Snacks & Sweets",
    "heading": "SNACKS & SWEETS",
    "expectedCount": 34,
    "items": [
      {
        "name": "potato chips salted",
        "unitLabel": "per bag"
      },
      {
        "name": "potato chips bbq",
        "unitLabel": "per bag"
      },
      {
        "name": "potato chips sour cream",
        "unitLabel": "per bag"
      },
      {
        "name": "corn chips plain",
        "unitLabel": "per bag"
      },
      {
        "name": "corn chips nacho",
        "unitLabel": "per bag"
      },
      {
        "name": "crackers plain",
        "unitLabel": "per box"
      },
      {
        "name": "crackers wholegrain",
        "unitLabel": "per box"
      },
      {
        "name": "rice crackers",
        "unitLabel": "per pack"
      },
      {
        "name": "sweet biscuits chocolate",
        "unitLabel": "per pack"
      },
      {
        "name": "sweet biscuits cream",
        "unitLabel": "per pack"
      },
      {
        "name": "cookies choc chip",
        "unitLabel": "per pack"
      },
      {
        "name": "milk chocolate bar",
        "unitLabel": "each"
      },
      {
        "name": "dark chocolate bar",
        "unitLabel": "each"
      },
      {
        "name": "white chocolate bar",
        "unitLabel": "each"
      },
      {
        "name": "lollies gummy",
        "unitLabel": "per bag"
      },
      {
        "name": "lollies sour",
        "unitLabel": "per bag"
      },
      {
        "name": "marshmallows",
        "unitLabel": "per pack"
      },
      {
        "name": "muesli bars fruit",
        "unitLabel": "per box"
      },
      {
        "name": "muesli bars chocolate",
        "unitLabel": "per box"
      },
      {
        "name": "protein bars",
        "unitLabel": "per box"
      },
      {
        "name": "low sugar protein bars",
        "unitLabel": "per box"
      },
      {
        "name": "microwave popcorn butter",
        "unitLabel": "per pack"
      },
      {
        "name": "microwave popcorn salted",
        "unitLabel": "per pack"
      },
      {
        "name": "mixed nuts salted",
        "unitLabel": "per pack"
      },
      {
        "name": "mixed nuts unsalted",
        "unitLabel": "per pack"
      },
      {
        "name": "trail mix fruit",
        "unitLabel": "per pack"
      },
      {
        "name": "trail mix nut",
        "unitLabel": "per pack"
      },
      {
        "name": "pretzels",
        "unitLabel": "per bag"
      },
      {
        "name": "beef jerky",
        "unitLabel": "per pack"
      },
      {
        "name": "fruit leather strips",
        "unitLabel": "per pack"
      },
      {
        "name": "ice cream tub vanilla",
        "unitLabel": "each"
      },
      {
        "name": "ice cream tub chocolate",
        "unitLabel": "each"
      },
      {
        "name": "ice cream sticks pack",
        "unitLabel": "each"
      },
      {
        "name": "frozen yoghurt tub",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "DRINKS",
    "label": "Drinks",
    "heading": "DRINKS",
    "expectedCount": 31,
    "items": [
      {
        "name": "bottled water small",
        "unitLabel": "each"
      },
      {
        "name": "bottled water large",
        "unitLabel": "each"
      },
      {
        "name": "sparkling water plain",
        "unitLabel": "per bottle"
      },
      {
        "name": "sparkling water flavoured",
        "unitLabel": "per bottle"
      },
      {
        "name": "cola 1.25L",
        "unitLabel": "each"
      },
      {
        "name": "diet cola 1.25L",
        "unitLabel": "each"
      },
      {
        "name": "zero cola 1.25L",
        "unitLabel": "each"
      },
      {
        "name": "lemonade 1.25L",
        "unitLabel": "each"
      },
      {
        "name": "diet lemonade 1.25L",
        "unitLabel": "each"
      },
      {
        "name": "orange juice with pulp",
        "unitLabel": "per litre"
      },
      {
        "name": "orange juice no pulp",
        "unitLabel": "per litre"
      },
      {
        "name": "apple juice clear",
        "unitLabel": "per litre"
      },
      {
        "name": "apple juice cloudy",
        "unitLabel": "per litre"
      },
      {
        "name": "mango nectar",
        "unitLabel": "per litre"
      },
      {
        "name": "iced tea bottle",
        "unitLabel": "each"
      },
      {
        "name": "energy drink can",
        "unitLabel": "each"
      },
      {
        "name": "sugar free energy drink can",
        "unitLabel": "each"
      },
      {
        "name": "sports drink bottle",
        "unitLabel": "each"
      },
      {
        "name": "low sugar sports drink bottle",
        "unitLabel": "each"
      },
      {
        "name": "ground coffee medium roast",
        "unitLabel": "per 500g"
      },
      {
        "name": "ground coffee dark roast",
        "unitLabel": "per 500g"
      },
      {
        "name": "instant coffee regular",
        "unitLabel": "per jar"
      },
      {
        "name": "instant coffee strong",
        "unitLabel": "per jar"
      },
      {
        "name": "coffee pods pack",
        "unitLabel": "per box"
      },
      {
        "name": "black tea bags",
        "unitLabel": "per box"
      },
      {
        "name": "green tea bags",
        "unitLabel": "per box"
      },
      {
        "name": "flavoured green tea",
        "unitLabel": "per box"
      },
      {
        "name": "herbal tea bags",
        "unitLabel": "per box"
      },
      {
        "name": "hot chocolate powder",
        "unitLabel": "per tin"
      },
      {
        "name": "dark hot chocolate powder",
        "unitLabel": "per tin"
      },
      {
        "name": "chai latte powder",
        "unitLabel": "per tin"
      }
    ]
  },
  {
    "enumValue": "CLOTHING_AND_FOOTWEAR",
    "label": "Clothing & Footwear",
    "heading": "CLOTHING & FOOTWEAR",
    "expectedCount": 88,
    "items": [
      {
        "name": "plain t-shirt",
        "unitLabel": "each"
      },
      {
        "name": "graphic t-shirt",
        "unitLabel": "each"
      },
      {
        "name": "oversized t-shirt",
        "unitLabel": "each"
      },
      {
        "name": "long sleeve t-shirt",
        "unitLabel": "each"
      },
      {
        "name": "sports t-shirt",
        "unitLabel": "each"
      },
      {
        "name": "polo shirt",
        "unitLabel": "each"
      },
      {
        "name": "button up shirt",
        "unitLabel": "each"
      },
      {
        "name": "short sleeve button shirt",
        "unitLabel": "each"
      },
      {
        "name": "dress shirt",
        "unitLabel": "each"
      },
      {
        "name": "flannel shirt",
        "unitLabel": "each"
      },
      {
        "name": "denim shirt",
        "unitLabel": "each"
      },
      {
        "name": "hoodie",
        "unitLabel": "each"
      },
      {
        "name": "zip hoodie",
        "unitLabel": "each"
      },
      {
        "name": "crewneck sweatshirt",
        "unitLabel": "each"
      },
      {
        "name": "fleece sweatshirt",
        "unitLabel": "each"
      },
      {
        "name": "light jacket",
        "unitLabel": "each"
      },
      {
        "name": "denim jacket",
        "unitLabel": "each"
      },
      {
        "name": "bomber jacket",
        "unitLabel": "each"
      },
      {
        "name": "puffer jacket",
        "unitLabel": "each"
      },
      {
        "name": "rain jacket",
        "unitLabel": "each"
      },
      {
        "name": "windbreaker",
        "unitLabel": "each"
      },
      {
        "name": "leather jacket",
        "unitLabel": "each"
      },
      {
        "name": "blazer",
        "unitLabel": "each"
      },
      {
        "name": "suit jacket",
        "unitLabel": "each"
      },
      {
        "name": "formal suit jacket",
        "unitLabel": "each"
      },
      {
        "name": "jeans slim fit",
        "unitLabel": "each"
      },
      {
        "name": "jeans regular fit",
        "unitLabel": "each"
      },
      {
        "name": "jeans relaxed fit",
        "unitLabel": "each"
      },
      {
        "name": "black jeans",
        "unitLabel": "each"
      },
      {
        "name": "blue jeans",
        "unitLabel": "each"
      },
      {
        "name": "ripped jeans",
        "unitLabel": "each"
      },
      {
        "name": "chinos",
        "unitLabel": "each"
      },
      {
        "name": "cargo pants",
        "unitLabel": "each"
      },
      {
        "name": "track pants",
        "unitLabel": "each"
      },
      {
        "name": "joggers",
        "unitLabel": "each"
      },
      {
        "name": "sweatpants",
        "unitLabel": "each"
      },
      {
        "name": "dress pants",
        "unitLabel": "each"
      },
      {
        "name": "athletic shorts",
        "unitLabel": "each"
      },
      {
        "name": "basketball shorts",
        "unitLabel": "each"
      },
      {
        "name": "denim shorts",
        "unitLabel": "each"
      },
      {
        "name": "cargo shorts",
        "unitLabel": "each"
      },
      {
        "name": "chino shorts",
        "unitLabel": "each"
      },
      {
        "name": "swim shorts",
        "unitLabel": "each"
      },
      {
        "name": "boxer shorts",
        "unitLabel": "per pack"
      },
      {
        "name": "boxer briefs",
        "unitLabel": "per pack"
      },
      {
        "name": "briefs",
        "unitLabel": "per pack"
      },
      {
        "name": "ankle socks",
        "unitLabel": "per pack"
      },
      {
        "name": "crew socks",
        "unitLabel": "per pack"
      },
      {
        "name": "long socks",
        "unitLabel": "per pack"
      },
      {
        "name": "sports socks",
        "unitLabel": "per pack"
      },
      {
        "name": "singlet",
        "unitLabel": "each"
      },
      {
        "name": "muscle tank",
        "unitLabel": "each"
      },
      {
        "name": "gym tank",
        "unitLabel": "each"
      },
      {
        "name": "pyjama set",
        "unitLabel": "each"
      },
      {
        "name": "pyjama pants",
        "unitLabel": "each"
      },
      {
        "name": "sleep shorts",
        "unitLabel": "each"
      },
      {
        "name": "robe",
        "unitLabel": "each"
      },
      {
        "name": "slippers",
        "unitLabel": "per pair"
      },
      {
        "name": "beanie",
        "unitLabel": "each"
      },
      {
        "name": "baseball cap",
        "unitLabel": "each"
      },
      {
        "name": "snapback cap",
        "unitLabel": "each"
      },
      {
        "name": "bucket hat",
        "unitLabel": "each"
      },
      {
        "name": "scarf",
        "unitLabel": "each"
      },
      {
        "name": "gloves winter",
        "unitLabel": "per pair"
      },
      {
        "name": "belt casual",
        "unitLabel": "each"
      },
      {
        "name": "belt leather",
        "unitLabel": "each"
      },
      {
        "name": "wallet bifold",
        "unitLabel": "each"
      },
      {
        "name": "coin pouch",
        "unitLabel": "each"
      },
      {
        "name": "watch digital",
        "unitLabel": "each"
      },
      {
        "name": "watch analog",
        "unitLabel": "each"
      },
      {
        "name": "sunglasses casual",
        "unitLabel": "each"
      },
      {
        "name": "sunglasses sport",
        "unitLabel": "each"
      },
      {
        "name": "running shoes",
        "unitLabel": "per pair"
      },
      {
        "name": "casual sneakers",
        "unitLabel": "per pair"
      },
      {
        "name": "high top sneakers",
        "unitLabel": "per pair"
      },
      {
        "name": "low top sneakers",
        "unitLabel": "per pair"
      },
      {
        "name": "training shoes",
        "unitLabel": "per pair"
      },
      {
        "name": "football boots",
        "unitLabel": "per pair"
      },
      {
        "name": "slides",
        "unitLabel": "per pair"
      },
      {
        "name": "flip flops",
        "unitLabel": "per pair"
      },
      {
        "name": "formal dress shoes",
        "unitLabel": "per pair"
      },
      {
        "name": "loafers",
        "unitLabel": "per pair"
      },
      {
        "name": "leather boots",
        "unitLabel": "per pair"
      },
      {
        "name": "work boots",
        "unitLabel": "per pair"
      },
      {
        "name": "hi-vis shirt",
        "unitLabel": "each"
      },
      {
        "name": "hi-vis hoodie",
        "unitLabel": "each"
      },
      {
        "name": "work shorts",
        "unitLabel": "each"
      },
      {
        "name": "rain pants",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "SCHOOL_STATIONERY_AND_TOYS",
    "label": "School, Stationery & Toys",
    "heading": "SCHOOL, STATIONERY & TOYS",
    "expectedCount": 80,
    "items": [
      {
        "name": "lined notebook",
        "unitLabel": "each"
      },
      {
        "name": "grid notebook",
        "unitLabel": "each"
      },
      {
        "name": "spiral notebook",
        "unitLabel": "each"
      },
      {
        "name": "hardcover notebook",
        "unitLabel": "each"
      },
      {
        "name": "mini notebook",
        "unitLabel": "each"
      },
      {
        "name": "exercise workbook",
        "unitLabel": "each"
      },
      {
        "name": "math workbook",
        "unitLabel": "each"
      },
      {
        "name": "english workbook",
        "unitLabel": "each"
      },
      {
        "name": "sketchbook",
        "unitLabel": "each"
      },
      {
        "name": "printer paper ream",
        "unitLabel": "each"
      },
      {
        "name": "photo paper pack",
        "unitLabel": "each"
      },
      {
        "name": "blue pen",
        "unitLabel": "each"
      },
      {
        "name": "black pen",
        "unitLabel": "each"
      },
      {
        "name": "gel pen",
        "unitLabel": "each"
      },
      {
        "name": "ballpoint pen",
        "unitLabel": "each"
      },
      {
        "name": "mechanical pencil",
        "unitLabel": "each"
      },
      {
        "name": "wooden pencil",
        "unitLabel": "each"
      },
      {
        "name": "colour pencils pack",
        "unitLabel": "each"
      },
      {
        "name": "markers pack",
        "unitLabel": "each"
      },
      {
        "name": "highlighters pack",
        "unitLabel": "each"
      },
      {
        "name": "eraser",
        "unitLabel": "each"
      },
      {
        "name": "sharpener",
        "unitLabel": "each"
      },
      {
        "name": "plastic ruler",
        "unitLabel": "each"
      },
      {
        "name": "metal ruler",
        "unitLabel": "each"
      },
      {
        "name": "glue stick",
        "unitLabel": "each"
      },
      {
        "name": "liquid glue",
        "unitLabel": "each"
      },
      {
        "name": "small scissors",
        "unitLabel": "each"
      },
      {
        "name": "medium scissors",
        "unitLabel": "each"
      },
      {
        "name": "clear tape",
        "unitLabel": "each"
      },
      {
        "name": "double sided tape",
        "unitLabel": "each"
      },
      {
        "name": "sticky notes small",
        "unitLabel": "per pack"
      },
      {
        "name": "sticky notes large",
        "unitLabel": "per pack"
      },
      {
        "name": "binder clips pack",
        "unitLabel": "each"
      },
      {
        "name": "paper clips pack",
        "unitLabel": "each"
      },
      {
        "name": "mini stapler",
        "unitLabel": "each"
      },
      {
        "name": "standard stapler",
        "unitLabel": "each"
      },
      {
        "name": "staples refill",
        "unitLabel": "each"
      },
      {
        "name": "plastic folder",
        "unitLabel": "each"
      },
      {
        "name": "cardboard folder",
        "unitLabel": "each"
      },
      {
        "name": "ring binder",
        "unitLabel": "each"
      },
      {
        "name": "document wallet",
        "unitLabel": "each"
      },
      {
        "name": "display book",
        "unitLabel": "each"
      },
      {
        "name": "clipboard",
        "unitLabel": "each"
      },
      {
        "name": "whiteboard small",
        "unitLabel": "each"
      },
      {
        "name": "whiteboard markers pack",
        "unitLabel": "each"
      },
      {
        "name": "whiteboard eraser",
        "unitLabel": "each"
      },
      {
        "name": "desk organiser",
        "unitLabel": "each"
      },
      {
        "name": "calculator basic",
        "unitLabel": "each"
      },
      {
        "name": "scientific calculator",
        "unitLabel": "each"
      },
      {
        "name": "backpack small",
        "unitLabel": "each"
      },
      {
        "name": "backpack large",
        "unitLabel": "each"
      },
      {
        "name": "pencil case small",
        "unitLabel": "each"
      },
      {
        "name": "pencil case large",
        "unitLabel": "each"
      },
      {
        "name": "lunch box plastic",
        "unitLabel": "each"
      },
      {
        "name": "lunch box insulated",
        "unitLabel": "each"
      },
      {
        "name": "drink bottle plastic",
        "unitLabel": "each"
      },
      {
        "name": "drink bottle metal",
        "unitLabel": "each"
      },
      {
        "name": "toy car small",
        "unitLabel": "each"
      },
      {
        "name": "toy truck",
        "unitLabel": "each"
      },
      {
        "name": "doll basic",
        "unitLabel": "each"
      },
      {
        "name": "action figure",
        "unitLabel": "each"
      },
      {
        "name": "building blocks set",
        "unitLabel": "each"
      },
      {
        "name": "lego style set small",
        "unitLabel": "each"
      },
      {
        "name": "lego style set large",
        "unitLabel": "each"
      },
      {
        "name": "jigsaw puzzle small",
        "unitLabel": "each"
      },
      {
        "name": "jigsaw puzzle large",
        "unitLabel": "each"
      },
      {
        "name": "colouring book",
        "unitLabel": "each"
      },
      {
        "name": "crayons pack",
        "unitLabel": "each"
      },
      {
        "name": "paint set",
        "unitLabel": "each"
      },
      {
        "name": "paint brushes pack",
        "unitLabel": "each"
      },
      {
        "name": "play dough pack",
        "unitLabel": "each"
      },
      {
        "name": "board game basic",
        "unitLabel": "each"
      },
      {
        "name": "playing cards",
        "unitLabel": "each"
      },
      {
        "name": "soccer ball",
        "unitLabel": "each"
      },
      {
        "name": "basketball",
        "unitLabel": "each"
      },
      {
        "name": "tennis balls pack",
        "unitLabel": "each"
      },
      {
        "name": "water blaster",
        "unitLabel": "each"
      },
      {
        "name": "remote control car",
        "unitLabel": "each"
      },
      {
        "name": "plush toy small",
        "unitLabel": "each"
      },
      {
        "name": "plush toy large",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "PERSONAL_CARE_AND_HEALTH",
    "label": "Personal Care & Health",
    "heading": "PERSONAL CARE & HEALTH",
    "expectedCount": 37,
    "items": [
      {
        "name": "toothbrush soft",
        "unitLabel": "each"
      },
      {
        "name": "toothbrush medium",
        "unitLabel": "each"
      },
      {
        "name": "electric toothbrush",
        "unitLabel": "each"
      },
      {
        "name": "toothpaste regular",
        "unitLabel": "each"
      },
      {
        "name": "toothpaste whitening",
        "unitLabel": "each"
      },
      {
        "name": "dental floss",
        "unitLabel": "each"
      },
      {
        "name": "mouthwash",
        "unitLabel": "each"
      },
      {
        "name": "shampoo bottle",
        "unitLabel": "each"
      },
      {
        "name": "conditioner bottle",
        "unitLabel": "each"
      },
      {
        "name": "bar soap",
        "unitLabel": "each"
      },
      {
        "name": "body wash bottle",
        "unitLabel": "each"
      },
      {
        "name": "face wash tube",
        "unitLabel": "each"
      },
      {
        "name": "moisturiser lotion",
        "unitLabel": "each"
      },
      {
        "name": "moisturiser cream",
        "unitLabel": "each"
      },
      {
        "name": "lip balm",
        "unitLabel": "each"
      },
      {
        "name": "deodorant stick",
        "unitLabel": "each"
      },
      {
        "name": "deodorant spray",
        "unitLabel": "each"
      },
      {
        "name": "razors disposable pack",
        "unitLabel": "each"
      },
      {
        "name": "shaving cream",
        "unitLabel": "each"
      },
      {
        "name": "hand soap liquid",
        "unitLabel": "each"
      },
      {
        "name": "hand sanitiser",
        "unitLabel": "each"
      },
      {
        "name": "sunscreen spf30",
        "unitLabel": "each"
      },
      {
        "name": "sunscreen spf50",
        "unitLabel": "each"
      },
      {
        "name": "cotton buds pack",
        "unitLabel": "each"
      },
      {
        "name": "cotton pads pack",
        "unitLabel": "each"
      },
      {
        "name": "tissues box",
        "unitLabel": "each"
      },
      {
        "name": "wet wipes pack",
        "unitLabel": "each"
      },
      {
        "name": "paracetamol tablets",
        "unitLabel": "each"
      },
      {
        "name": "ibuprofen tablets",
        "unitLabel": "each"
      },
      {
        "name": "vitamin tablets",
        "unitLabel": "each"
      },
      {
        "name": "bandages pack",
        "unitLabel": "each"
      },
      {
        "name": "antiseptic cream",
        "unitLabel": "each"
      },
      {
        "name": "first aid kit",
        "unitLabel": "each"
      },
      {
        "name": "thermometer digital",
        "unitLabel": "each"
      },
      {
        "name": "heat pack reusable",
        "unitLabel": "each"
      },
      {
        "name": "eye drops",
        "unitLabel": "each"
      },
      {
        "name": "cough syrup",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "CLEANING_AND_HOUSEHOLD",
    "label": "Cleaning & Household",
    "heading": "CLEANING & HOUSEHOLD",
    "expectedCount": 64,
    "items": [
      {
        "name": "laundry detergent small",
        "unitLabel": "each"
      },
      {
        "name": "laundry detergent large",
        "unitLabel": "each"
      },
      {
        "name": "fabric softener",
        "unitLabel": "each"
      },
      {
        "name": "dishwashing liquid small",
        "unitLabel": "each"
      },
      {
        "name": "dishwashing liquid large",
        "unitLabel": "each"
      },
      {
        "name": "dishwasher tablets pack",
        "unitLabel": "each"
      },
      {
        "name": "surface cleaner spray",
        "unitLabel": "each"
      },
      {
        "name": "disinfectant spray",
        "unitLabel": "each"
      },
      {
        "name": "glass cleaner spray",
        "unitLabel": "each"
      },
      {
        "name": "bleach bottle",
        "unitLabel": "each"
      },
      {
        "name": "mould cleaner spray",
        "unitLabel": "each"
      },
      {
        "name": "toilet cleaner bottle",
        "unitLabel": "each"
      },
      {
        "name": "cleaning cloth pack",
        "unitLabel": "each"
      },
      {
        "name": "microfibre cloth pack",
        "unitLabel": "each"
      },
      {
        "name": "sponges pack",
        "unitLabel": "each"
      },
      {
        "name": "scrub brush",
        "unitLabel": "each"
      },
      {
        "name": "rubber gloves",
        "unitLabel": "per pair"
      },
      {
        "name": "bin bags small",
        "unitLabel": "each"
      },
      {
        "name": "bin bags large",
        "unitLabel": "each"
      },
      {
        "name": "food storage bags",
        "unitLabel": "each"
      },
      {
        "name": "zip lock bags small",
        "unitLabel": "each"
      },
      {
        "name": "zip lock bags large",
        "unitLabel": "each"
      },
      {
        "name": "cling wrap",
        "unitLabel": "each"
      },
      {
        "name": "aluminium foil",
        "unitLabel": "each"
      },
      {
        "name": "baking paper",
        "unitLabel": "each"
      },
      {
        "name": "paper towel rolls",
        "unitLabel": "each"
      },
      {
        "name": "toilet paper 2 ply",
        "unitLabel": "each"
      },
      {
        "name": "toilet paper 3 ply",
        "unitLabel": "each"
      },
      {
        "name": "air freshener spray",
        "unitLabel": "each"
      },
      {
        "name": "air freshener gel",
        "unitLabel": "each"
      },
      {
        "name": "scented candles",
        "unitLabel": "each"
      },
      {
        "name": "plain candles pack",
        "unitLabel": "each"
      },
      {
        "name": "matches box",
        "unitLabel": "each"
      },
      {
        "name": "batteries AA pack",
        "unitLabel": "each"
      },
      {
        "name": "batteries AAA pack",
        "unitLabel": "each"
      },
      {
        "name": "light bulb warm",
        "unitLabel": "each"
      },
      {
        "name": "light bulb cool",
        "unitLabel": "each"
      },
      {
        "name": "extension cord short",
        "unitLabel": "each"
      },
      {
        "name": "extension cord long",
        "unitLabel": "each"
      },
      {
        "name": "power board basic",
        "unitLabel": "each"
      },
      {
        "name": "power board surge protected",
        "unitLabel": "each"
      },
      {
        "name": "door mat small",
        "unitLabel": "each"
      },
      {
        "name": "door mat large",
        "unitLabel": "each"
      },
      {
        "name": "umbrella compact",
        "unitLabel": "each"
      },
      {
        "name": "umbrella full size",
        "unitLabel": "each"
      },
      {
        "name": "rain poncho",
        "unitLabel": "each"
      },
      {
        "name": "laundry basket small",
        "unitLabel": "each"
      },
      {
        "name": "laundry basket large",
        "unitLabel": "each"
      },
      {
        "name": "clothes hangers plastic",
        "unitLabel": "per pack"
      },
      {
        "name": "clothes hangers wooden",
        "unitLabel": "per pack"
      },
      {
        "name": "pegs pack",
        "unitLabel": "each"
      },
      {
        "name": "ironing board",
        "unitLabel": "each"
      },
      {
        "name": "iron clothes",
        "unitLabel": "each"
      },
      {
        "name": "storage box small",
        "unitLabel": "each"
      },
      {
        "name": "storage box medium",
        "unitLabel": "each"
      },
      {
        "name": "storage box large",
        "unitLabel": "each"
      },
      {
        "name": "drawer organiser",
        "unitLabel": "each"
      },
      {
        "name": "shelf organiser",
        "unitLabel": "each"
      },
      {
        "name": "shoe rack",
        "unitLabel": "each"
      },
      {
        "name": "coat hooks",
        "unitLabel": "each"
      },
      {
        "name": "mirror small",
        "unitLabel": "each"
      },
      {
        "name": "mirror medium",
        "unitLabel": "each"
      },
      {
        "name": "picture frame small",
        "unitLabel": "each"
      },
      {
        "name": "picture frame large",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "KITCHEN_AND_DINING",
    "label": "Kitchen & Dining",
    "heading": "KITCHEN & DINING",
    "expectedCount": 43,
    "items": [
      {
        "name": "plate ceramic",
        "unitLabel": "each"
      },
      {
        "name": "plate plastic",
        "unitLabel": "each"
      },
      {
        "name": "bowl ceramic",
        "unitLabel": "each"
      },
      {
        "name": "bowl plastic",
        "unitLabel": "each"
      },
      {
        "name": "mug ceramic",
        "unitLabel": "each"
      },
      {
        "name": "glass tumbler",
        "unitLabel": "each"
      },
      {
        "name": "wine glass",
        "unitLabel": "each"
      },
      {
        "name": "cutlery set metal",
        "unitLabel": "per set"
      },
      {
        "name": "cutlery set plastic",
        "unitLabel": "per set"
      },
      {
        "name": "chef knife",
        "unitLabel": "each"
      },
      {
        "name": "paring knife",
        "unitLabel": "each"
      },
      {
        "name": "bread knife",
        "unitLabel": "each"
      },
      {
        "name": "cutting board small",
        "unitLabel": "each"
      },
      {
        "name": "cutting board large",
        "unitLabel": "each"
      },
      {
        "name": "frying pan small",
        "unitLabel": "each"
      },
      {
        "name": "frying pan large",
        "unitLabel": "each"
      },
      {
        "name": "saucepan small",
        "unitLabel": "each"
      },
      {
        "name": "saucepan large",
        "unitLabel": "each"
      },
      {
        "name": "cooking pot small",
        "unitLabel": "each"
      },
      {
        "name": "cooking pot large",
        "unitLabel": "each"
      },
      {
        "name": "baking tray",
        "unitLabel": "each"
      },
      {
        "name": "muffin tray",
        "unitLabel": "each"
      },
      {
        "name": "mixing bowl small",
        "unitLabel": "each"
      },
      {
        "name": "mixing bowl large",
        "unitLabel": "each"
      },
      {
        "name": "measuring cups set",
        "unitLabel": "each"
      },
      {
        "name": "measuring spoons set",
        "unitLabel": "each"
      },
      {
        "name": "colander",
        "unitLabel": "each"
      },
      {
        "name": "peeler",
        "unitLabel": "each"
      },
      {
        "name": "grater",
        "unitLabel": "each"
      },
      {
        "name": "can opener",
        "unitLabel": "each"
      },
      {
        "name": "bottle opener",
        "unitLabel": "each"
      },
      {
        "name": "tongs",
        "unitLabel": "each"
      },
      {
        "name": "spatula",
        "unitLabel": "each"
      },
      {
        "name": "wooden spoon",
        "unitLabel": "each"
      },
      {
        "name": "ladle",
        "unitLabel": "each"
      },
      {
        "name": "whisk",
        "unitLabel": "each"
      },
      {
        "name": "food storage containers set",
        "unitLabel": "each"
      },
      {
        "name": "lunch bag insulated",
        "unitLabel": "each"
      },
      {
        "name": "travel mug",
        "unitLabel": "each"
      },
      {
        "name": "coffee cup reusable",
        "unitLabel": "each"
      },
      {
        "name": "dish rack",
        "unitLabel": "each"
      },
      {
        "name": "water jug",
        "unitLabel": "each"
      },
      {
        "name": "thermos flask",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "BABY",
    "label": "Baby",
    "heading": "BABY",
    "expectedCount": 23,
    "items": [
      {
        "name": "baby food pouch",
        "unitLabel": "each"
      },
      {
        "name": "baby cereal box",
        "unitLabel": "each"
      },
      {
        "name": "infant formula tin",
        "unitLabel": "each"
      },
      {
        "name": "baby bottle",
        "unitLabel": "each"
      },
      {
        "name": "baby bottle twin pack",
        "unitLabel": "each"
      },
      {
        "name": "dummy pack",
        "unitLabel": "each"
      },
      {
        "name": "teether",
        "unitLabel": "each"
      },
      {
        "name": "nappies small pack",
        "unitLabel": "each"
      },
      {
        "name": "nappies value pack",
        "unitLabel": "each"
      },
      {
        "name": "baby wipes small pack",
        "unitLabel": "each"
      },
      {
        "name": "baby wipes bulk pack",
        "unitLabel": "each"
      },
      {
        "name": "baby shampoo",
        "unitLabel": "each"
      },
      {
        "name": "baby wash",
        "unitLabel": "each"
      },
      {
        "name": "baby lotion",
        "unitLabel": "each"
      },
      {
        "name": "baby bib pack",
        "unitLabel": "each"
      },
      {
        "name": "baby blanket",
        "unitLabel": "each"
      },
      {
        "name": "baby onesie",
        "unitLabel": "each"
      },
      {
        "name": "baby socks pack",
        "unitLabel": "each"
      },
      {
        "name": "baby towel hooded",
        "unitLabel": "each"
      },
      {
        "name": "baby bath tub",
        "unitLabel": "each"
      },
      {
        "name": "pram basic",
        "unitLabel": "each"
      },
      {
        "name": "car seat basic",
        "unitLabel": "each"
      },
      {
        "name": "high chair basic",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "PET",
    "label": "Pet",
    "heading": "PET",
    "expectedCount": 24,
    "items": [
      {
        "name": "dry dog food small bag",
        "unitLabel": "each"
      },
      {
        "name": "dry dog food large bag",
        "unitLabel": "each"
      },
      {
        "name": "wet dog food can",
        "unitLabel": "each"
      },
      {
        "name": "dog treats pack",
        "unitLabel": "each"
      },
      {
        "name": "dog leash basic",
        "unitLabel": "each"
      },
      {
        "name": "dog collar basic",
        "unitLabel": "each"
      },
      {
        "name": "dog harness",
        "unitLabel": "each"
      },
      {
        "name": "dog bowl small",
        "unitLabel": "each"
      },
      {
        "name": "dog bowl large",
        "unitLabel": "each"
      },
      {
        "name": "dog bed small",
        "unitLabel": "each"
      },
      {
        "name": "dog bed large",
        "unitLabel": "each"
      },
      {
        "name": "chew toy dog",
        "unitLabel": "each"
      },
      {
        "name": "tennis ball dog toy",
        "unitLabel": "each"
      },
      {
        "name": "dry cat food small bag",
        "unitLabel": "each"
      },
      {
        "name": "dry cat food large bag",
        "unitLabel": "each"
      },
      {
        "name": "wet cat food can",
        "unitLabel": "each"
      },
      {
        "name": "cat litter bag",
        "unitLabel": "each"
      },
      {
        "name": "cat litter clumping bag",
        "unitLabel": "each"
      },
      {
        "name": "cat bowl small",
        "unitLabel": "each"
      },
      {
        "name": "cat scratching post",
        "unitLabel": "each"
      },
      {
        "name": "cat toy small",
        "unitLabel": "each"
      },
      {
        "name": "cat toy interactive",
        "unitLabel": "each"
      },
      {
        "name": "fish food flakes",
        "unitLabel": "each"
      },
      {
        "name": "bird seed bag",
        "unitLabel": "each"
      }
    ]
  },
  {
    "enumValue": "TECH_ELECTRONICS_AND_APPLIANCES",
    "label": "Tech, Electronics & Appliances",
    "heading": "TECH, ELECTRONICS & APPLIANCES",
    "expectedCount": 114,
    "items": [
      {
        "name": "phone charger cable",
        "unitLabel": "each"
      },
      {
        "name": "fast charging cable",
        "unitLabel": "each"
      },
      {
        "name": "wall charger adapter",
        "unitLabel": "each"
      },
      {
        "name": "wireless charger",
        "unitLabel": "each"
      },
      {
        "name": "power bank small",
        "unitLabel": "each"
      },
      {
        "name": "power bank large",
        "unitLabel": "each"
      },
      {
        "name": "earphones wired",
        "unitLabel": "each"
      },
      {
        "name": "earbuds wireless budget",
        "unitLabel": "each"
      },
      {
        "name": "earbuds wireless premium",
        "unitLabel": "each"
      },
      {
        "name": "headphones over ear",
        "unitLabel": "each"
      },
      {
        "name": "noise cancelling headphones",
        "unitLabel": "each"
      },
      {
        "name": "bluetooth speaker small",
        "unitLabel": "each"
      },
      {
        "name": "bluetooth speaker large",
        "unitLabel": "each"
      },
      {
        "name": "smartphone budget",
        "unitLabel": "each"
      },
      {
        "name": "smartphone mid range",
        "unitLabel": "each"
      },
      {
        "name": "smartphone flagship",
        "unitLabel": "each"
      },
      {
        "name": "foldable smartphone",
        "unitLabel": "each"
      },
      {
        "name": "tablet mini",
        "unitLabel": "each"
      },
      {
        "name": "tablet standard",
        "unitLabel": "each"
      },
      {
        "name": "tablet pro",
        "unitLabel": "each"
      },
      {
        "name": "smartwatch fitness",
        "unitLabel": "each"
      },
      {
        "name": "smartwatch premium",
        "unitLabel": "each"
      },
      {
        "name": "fitness tracker",
        "unitLabel": "each"
      },
      {
        "name": "laptop budget",
        "unitLabel": "each"
      },
      {
        "name": "laptop business",
        "unitLabel": "each"
      },
      {
        "name": "laptop ultrabook",
        "unitLabel": "each"
      },
      {
        "name": "gaming laptop",
        "unitLabel": "each"
      },
      {
        "name": "2 in 1 laptop",
        "unitLabel": "each"
      },
      {
        "name": "desktop office pc",
        "unitLabel": "each"
      },
      {
        "name": "desktop gaming pc",
        "unitLabel": "each"
      },
      {
        "name": "mini desktop pc",
        "unitLabel": "each"
      },
      {
        "name": "all in one pc",
        "unitLabel": "each"
      },
      {
        "name": "monitor 24 inch",
        "unitLabel": "each"
      },
      {
        "name": "gaming monitor 24 inch",
        "unitLabel": "each"
      },
      {
        "name": "gaming monitor 27 inch",
        "unitLabel": "each"
      },
      {
        "name": "ultrawide monitor",
        "unitLabel": "each"
      },
      {
        "name": "4k monitor",
        "unitLabel": "each"
      },
      {
        "name": "mechanical keyboard",
        "unitLabel": "each"
      },
      {
        "name": "wireless keyboard",
        "unitLabel": "each"
      },
      {
        "name": "gaming mouse wired",
        "unitLabel": "each"
      },
      {
        "name": "gaming mouse wireless",
        "unitLabel": "each"
      },
      {
        "name": "ergonomic mouse",
        "unitLabel": "each"
      },
      {
        "name": "webcam full hd",
        "unitLabel": "each"
      },
      {
        "name": "microphone usb",
        "unitLabel": "each"
      },
      {
        "name": "usb flash drive 32GB",
        "unitLabel": "each"
      },
      {
        "name": "usb flash drive 64GB",
        "unitLabel": "each"
      },
      {
        "name": "external ssd 500GB",
        "unitLabel": "each"
      },
      {
        "name": "external ssd 1TB",
        "unitLabel": "each"
      },
      {
        "name": "external hdd 2TB",
        "unitLabel": "each"
      },
      {
        "name": "wifi router basic",
        "unitLabel": "each"
      },
      {
        "name": "wifi router high speed",
        "unitLabel": "each"
      },
      {
        "name": "mesh wifi system",
        "unitLabel": "each"
      },
      {
        "name": "printer inkjet",
        "unitLabel": "each"
      },
      {
        "name": "printer laser",
        "unitLabel": "each"
      },
      {
        "name": "printer all in one",
        "unitLabel": "each"
      },
      {
        "name": "scanner flatbed",
        "unitLabel": "each"
      },
      {
        "name": "gaming headset",
        "unitLabel": "each"
      },
      {
        "name": "vr headset standalone",
        "unitLabel": "each"
      },
      {
        "name": "handheld gaming console",
        "unitLabel": "each"
      },
      {
        "name": "gaming console standard",
        "unitLabel": "each"
      },
      {
        "name": "gaming console digital",
        "unitLabel": "each"
      },
      {
        "name": "action camera",
        "unitLabel": "each"
      },
      {
        "name": "digital camera compact",
        "unitLabel": "each"
      },
      {
        "name": "mirrorless camera",
        "unitLabel": "each"
      },
      {
        "name": "camera tripod",
        "unitLabel": "each"
      },
      {
        "name": "smart tv 43 inch",
        "unitLabel": "each"
      },
      {
        "name": "smart tv 55 inch",
        "unitLabel": "each"
      },
      {
        "name": "smart tv 65 inch",
        "unitLabel": "each"
      },
      {
        "name": "oled tv premium",
        "unitLabel": "each"
      },
      {
        "name": "soundbar",
        "unitLabel": "each"
      },
      {
        "name": "smart home hub",
        "unitLabel": "each"
      },
      {
        "name": "smart light bulb",
        "unitLabel": "each"
      },
      {
        "name": "smart plug",
        "unitLabel": "each"
      },
      {
        "name": "security camera indoor",
        "unitLabel": "each"
      },
      {
        "name": "security camera outdoor",
        "unitLabel": "each"
      },
      {
        "name": "microwave basic",
        "unitLabel": "each"
      },
      {
        "name": "microwave grill",
        "unitLabel": "each"
      },
      {
        "name": "air fryer small",
        "unitLabel": "each"
      },
      {
        "name": "air fryer large",
        "unitLabel": "each"
      },
      {
        "name": "toaster 2 slice",
        "unitLabel": "each"
      },
      {
        "name": "toaster 4 slice",
        "unitLabel": "each"
      },
      {
        "name": "kettle electric",
        "unitLabel": "each"
      },
      {
        "name": "blender standard",
        "unitLabel": "each"
      },
      {
        "name": "blender high power",
        "unitLabel": "each"
      },
      {
        "name": "food processor",
        "unitLabel": "each"
      },
      {
        "name": "coffee machine pod",
        "unitLabel": "each"
      },
      {
        "name": "coffee machine espresso",
        "unitLabel": "each"
      },
      {
        "name": "vacuum cleaner standard",
        "unitLabel": "each"
      },
      {
        "name": "vacuum cleaner cordless",
        "unitLabel": "each"
      },
      {
        "name": "robot vacuum",
        "unitLabel": "each"
      },
      {
        "name": "washing machine top load",
        "unitLabel": "each"
      },
      {
        "name": "washing machine front load",
        "unitLabel": "each"
      },
      {
        "name": "dryer standard",
        "unitLabel": "each"
      },
      {
        "name": "dishwasher compact",
        "unitLabel": "each"
      },
      {
        "name": "dishwasher full size",
        "unitLabel": "each"
      },
      {
        "name": "fridge small",
        "unitLabel": "each"
      },
      {
        "name": "fridge medium",
        "unitLabel": "each"
      },
      {
        "name": "fridge large",
        "unitLabel": "each"
      },
      {
        "name": "freezer chest small",
        "unitLabel": "each"
      },
      {
        "name": "portable heater",
        "unitLabel": "each"
      },
      {
        "name": "tower fan",
        "unitLabel": "each"
      },
      {
        "name": "air purifier",
        "unitLabel": "each"
      },
      {
        "name": "portable air conditioner",
        "unitLabel": "each"
      },
      {
        "name": "office chair ergonomic",
        "unitLabel": "each"
      },
      {
        "name": "gaming chair",
        "unitLabel": "each"
      },
      {
        "name": "desk basic",
        "unitLabel": "each"
      },
      {
        "name": "standing desk electric",
        "unitLabel": "each"
      },
      {
        "name": "bed frame single",
        "unitLabel": "each"
      },
      {
        "name": "bed frame queen",
        "unitLabel": "each"
      },
      {
        "name": "mattress single",
        "unitLabel": "each"
      },
      {
        "name": "mattress queen",
        "unitLabel": "each"
      },
      {
        "name": "wardrobe basic",
        "unitLabel": "each"
      },
      {
        "name": "bookshelf",
        "unitLabel": "each"
      },
      {
        "name": "side table",
        "unitLabel": "each"
      }
    ]
  }
] as const;
