'use strict';

window.addEventListener('load', go);

// SAM Design Pattern : http://sam.js.org/
let samActions, samModel, samState, samView;

function go() {
    console.info('Go!');

    samActions.exec({ do: 'init', artiPart1: artiPart1Data, artiPart2: artiPart2Data });

    // pour un nombre de lignes pleines d'articles quelque soit la largeur du navigateur
    window.addEventListener('resize', () => { samActions.exec({ do: 'updatePagination' }) });
}











//----------------------------------------------------------------- Actions ---
// Actions appelées dans le code HTML quand des événements surviennent
//

samActions = {

    exec(data) {
        let enableAnimation = true; // pour les animations sur l'interface graphique
        let proposal;
        switch (data.do) {
            case 'init':
                {
                    // console.log('samActions.init');
                    proposal = { do: data.do, artiPart1: data.artiPart1, artiPart2: data.artiPart2 };
                    enableAnimation = false;
                }
                break;
                // Display 
            case 'viewCartToggle':
            case 'gridListView':
                // Filters
                // TODO
                // Settings
            case 'imagesToggle':
            case 'animationsToggle':
                // Pagination
                // TODO
                // Cart
                // TODO

            case 'with animation':
                proposal = data;
                break;

                // Articles
                // TODO
            case 'darkThemeToggle':
            case 'updatePagination':

            case 'without animation':
                enableAnimation = false;
                proposal = data;
                break;

            default:
                console.error('samActions - Action non prise en compte : ', data);
                return;
        }
        if (enableAnimation && samModel.model.settings.animations)
            setTimeout(() => samModel.samPresent(proposal), 200);
        else samModel.samPresent(proposal);
    },

};











//-------------------------------------------------------------------- Model ---
// Unique source de vérité de l'application
//

const initialModel = {
    authors: ['Lassis', 'Abadie'],

    artiPart1: [],
    artiPart2: [],
    articles: {
        values: [],
        hasChanged: true,
    },
    categories: [],
    origins: [],

    filters: {
        categories: {
            booleans: {}, // filtre actif ou non pour chaque catégorie
            count: {}, // nombre d'articles de chaque catégorie
        },
        origins: {
            booleans: {},
            count: {},
        },
        search: {
            global: false, // recherche sur tous les articles ou seulement les articles filtrés
            text: 'a', // texte recherché
        },
    },
    settings: {
        articleImages: true,
        animations: true,
        darkTheme: false,
    },
    display: {
        cartView: true, // panier visible ou non
        articlesView: 'grid', // affichage en 'grid' ou 'list'
    },
    pagination: {
        grid: {
            currentPage: 1,
            linesPerPage: 1,
            linesPerPageOptions: [1, 2, 3],
        },
        list: {
            currentPage: 1,
            linesPerPage: 6,
            linesPerPageOptions: [3, 6, 9],
        },
    },

    cartSort: {
        property: 'name', // tri du panier selon cette propriété
        ascending: { // ordre du tri pour chaque propriété
            name: true,
            quantity: true,
            total: true,
        },
        hasChanged: true,
    },
};

samModel = {

    model: initialModel,

    // Demande au modèle de se mettre à jour en fonction des données qu'on
    // lui présente.
    // l'argument data est un objet confectionné dans les actions.
    // Les propriétés de data désignent la modification à faire sur le modèle.
    samPresent(data) {
        switch (data.do) {
            case 'init':
                {
                    console.log('samModel.init');
                    // this.model.artiPart1 = data.artiPart1;
                    // this.model.artiPart2 = data.artiPart2;
                    this.modelAssign('artiPart1', data.artiPart1);
                    this.modelAssign('artiPart2', data.artiPart2);
                    this.createArticles();
                    this.extractCategories();
                    this.extractOrigins();
                }
                break;

            case 'viewCartToggle':
                this.modelToggle('display.cartView');
                break;
            case 'imagesToggle':
                this.modelToggle('settings.articleImages');
                break;
            case 'animationsToggle':
                this.modelToggle('settings.animations');
                break;
            case 'darkThemeToggle':
                this.modelToggle('settings.darkTheme');
                break;
            case 'gridListView':
                this.modelAssign('display.articlesView', data.view);
                break;

            case 'updatePagination':
                break;

                // TODO

            default:
                console.error('samPresent() - proposition non prise en compte : ', data);
                return;
        }

        // Demande à l'état de l'application de prendre en compte la modification
        // du modèle
        samState.samUpdate(this.model);

        this.model.articles.hasChanged = false;
        this.model.cartSort.hasChanged = false;
    },

    /**
     * Cadeau : Affecte value à la propriété propertyStr
     * 
     * modelToggle('display.cartView'); 
     * est équivalent à :
     * this.model.display.cartView = !this.model.display.cartView;
     * 
     * Intérêt : plus compact et un message d'erreur est envoyé si le nom de la proprité est incorrecte
     * ou si les types sont différents.
     *
     * @param {string} propertyStr 
     * @param {any}    value 
     */
    modelToggle(propertyStr) {
        const root = 'model';
        const path = propertyStr.split('.');
        let val = this[root];
        let pathNames = ['this', root];
        path.some((v, i, a) => {
            pathNames.push(v);
            if (val[v] === undefined) {
                console.error(`modelToggle(${propertyStr}) : ${pathNames.join('.')} is undefined`);
                return true;
            }
            if (i < a.length - 1) {
                val = val[v];
            } else {
                if (typeof val[v] != undefined && typeof val[v] != 'boolean') {
                    console.error(`modelToggle(${propertyStr}) : ${pathNames.join('.')} is not a boolean`);
                    return true;
                };
                val[v] = !val[v];
            }
        });
    },
    /**
     * Cadeau : Transforme une propriété booléenne en son opposée (true -> false, false -> true)
     * 
     * this.modelAssign('artiPart1', data.artiPart1);
     * est équivalent à :
     * this.model.artiPart1 = data.artiPart1;
     *
     * Intérêt : un message d'erreur est envoyé si le nom de la proprité est incorrecte
     * ou si elle n'est pas de type booléen.
     *
     * @param {string} propertyStr 
     */
    modelAssign(propertyStr, value) {
        const root = 'model';
        const path = propertyStr.split('.');
        let val = this[root];
        let pathNames = ['this', root];
        path.some((v, i, a) => {
            pathNames.push(v);
            if (val[v] === undefined) {
                console.error(`modelToggle(${propertyStr}) : ${pathNames.join('.')} is undefined`);
                return true;
            }
            if (i < a.length - 1) {
                val = val[v];
            } else {
                if (typeof val[v] != undefined && typeof val[v] !== typeof value) {
                    console.error(`modelToggle(${propertyStr}) : ${pathNames.join('.')} (${typeof val[v]}) is not of the same type of ${value} (${typeof value})`);
                    return true;
                };
                val[v] = value;
            }
        });
    },

    /**
     * fonction à passer en paramete à Array.sort() pour trier un tableau d'objets
     * selon leur nom, et leur prix s'il ont le même nom.
     *
     * @param {Object} a 
     * @param {Object} b 
     * @returns -1 or 0 or 1
     */
    articlesSort(a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        if (a.price < b.price) return -1;
        if (a.price > b.price) return 1;
        return 0;

    },

    /**
     * Création des articles à partir des deux fichiers de données (ArtiPart1 et ArtiPart2).
     *
     * Ce sont ces articles que l'interface graphique va représenter. 
     */
    createArticles() {
        const artiPart1 = this.model.artiPart1;
        const artiPart2 = this.model.artiPart2;

        let articleId = 0;

        const articles = artiPart1.map((a1) => {

            const articlesTmp = artiPart2.filter((a) => a.id == a1.id).map((a2) => {

                const article = {
                    id: articleId, // création d'un identifiant unique pour chaque article
                    // from artiPart2
                    name: a2.name,
                    category: a2.category,
                    pictures: a2.pictures,
                    // from artiPart1
                    origin: a1.origin,
                    price: a1.price,
                    unit: a1.unit,
                    quantity: a1.quantity,
                    inCart: a1.inCart,
                };
                articleId++;

                return article;
            });
            return articlesTmp[0];
        });
        this.model.articles.values = articles.sort(this.articlesSort); // articles triés
        this.model.articles.hasChanged = true;
    },

    /**
     * Pour un tri par ordre alphabétique
     * 
     */
    alphaSort(a, b) {

        // TODO

        return -1;
    },

    /**
     * Extraction :
     * - des catégories présentes dans la liste d'articles    --> model.categories
     * - du nombre d'articles appartenant à chaque catégories --> model.filters.categories.count
     *      model.filters.categories.count['fruits'] === 5
     * - du tableau de booléens pour l'état du filtre sur les catégories --> model.filters.categories.booleans
     *      model.filters.categories.booleans['fruits'] === true
     *
     * Les catégories sont triées par ordre alphabétique
     */


    extractCategories() {
        const articles = this.model.articles.values;
        const categories = [];
        const catsCount = {};
        const catsFilter = {};
        const categorieCount = [];

        // on définit un tableau avec les différentes catégories 
        artiPart2Data.forEach(el => {
            if (!categories.includes(el.category)) {
                categories.push(el.category)
            }
        })

        // On créé un tableau d'objet qui instancie un compteur pour chaques catégories
        categories.forEach(cat => {
            categorieCount.push({
                nature: cat,
                compteur: 0
            })
        })

        /*Calcul du nombre pour chaque catégorie*/
        console.log(categorieCount)

        artiPart1Data.forEach(element => {
            artiPart2Data.forEach(objet => {
                if (objet.id === element.id) {
                    if (categories.includes(objet.category)) {
                        categorieCount.find(el => el.nature === objet.category).compteur++;
                    }
                }
            });
        });

        categories.sort(this.alphaSort);
        this.model.categories = categories;
        this.model.filters.categories.count = catsCount;
        this.model.filters.categories.booleans = catsFilter;
    },

    extractOrigins() {
        // TODO  
    },
};











//-------------------------------------------------------------------- State ---
// État de l'application avant affichage
//

const initialState = {

    filteredArticles: { // articles filtrés
        values: [],
        hasChanged: true,
        representation: '', // représentation pour ne pas avoir à la recalculer si n'a pas changé
    },

    filters: {
        categories: {
            booleans: {}, // avec une propriété 'toutes' en plus qui vaut true si toutes les autres sont 'true'
            hasChanged: true,
            representation: '',
        },
        origins: {
            booleans: {}, // avec une propriété 'toutes' aussi
            hasChanged: true,
            representation: '',
        },
        search: {
            global: false,
            text: '',
            hasChanged: true,
            representation: '',
        },
    },
    display: {
        cartView: {
            value: true,
            hasChanged: true,
        },
        articlesView: {
            value: '',
            hasChanged: true,
        },
    },
    pagination: { // Toutes ces valeurs sont calculées dans updatePagination()
        grid: {
            currentPage: undefined,
            linesPerPage: undefined,
            linesPerPageOptions: undefined,

            maxArticlesPerLine: undefined,
            numberOfPages: undefined,
            hasPrevPage: undefined,
            hasNextPage: undefined,
        },
        list: {
            currentPage: undefined,
            linesPerPage: undefined,
            linesPerPageOptions: undefined,

            maxArticlesPerLine: undefined,
            numberOfPages: undefined,
            hasPrevPage: undefined,
            hasNextPage: undefined,
        },
    },

    cart: {
        values: [], // le panier rassemble tous les articles dont inCart==true
        total: 0, // valeur totale du panier
        hasChanged: true,
        representation: '',
    },
    cartSort: { // pour le tri des articles du panier
        property: 'name',
        ascending: {
            name: true,
            quantity: true,
            total: true,
        },
        hasChanged: true,
    },

};

samState = {

    state: initialState,

    samUpdate(model) {
        this.updateFilter(model.filters.categories, this.state.filters.categories);
        this.updateFilter(model.filters.origins, this.state.filters.origins);
        this.updateSearch(model.filters.search);
        this.filterArticles(model.articles, this.state.filters);
        this.updateDisplay(model.display);
        this.updatePagination(model.pagination);
        this.updateCartSort(model.cartSort);
        this.updateCart(model);

        this.samRepresent(model);

        // Nothing more to change
        this.state.filteredArticles.hasChanged = false;
        this.state.filters.categories.hasChanged = false;
        this.state.filters.origins.hasChanged = false;
        this.state.filters.search.hasChanged = false;
        this.state.display.cartView.hasChanged = false;
        this.state.display.articlesView.hasChanged = false;
        this.state.cartSort.hasChanged = false;
        this.state.cart.hasChanged = false;
    },

    /**
     * recopie les filtres du model dans le state
     * ajoute la propriété 'toutes' au tableau booleans
     */
    updateFilter(modelFilter, stateFilter) {

        console.log('updateFilter', modelFilter)

        // TODO

    },

    updateSearch(modelSearch) {
        const stateSearch = this.state.filters.search;
        const globalHasChanged = modelSearch.global != stateSearch.global;
        const textHasChanged = modelSearch.text != stateSearch.text;
        stateSearch.hasChanged = globalHasChanged || textHasChanged;
        stateSearch.global = modelSearch.global;
        stateSearch.text = modelSearch.text;
    },

    filterArticles(articles, filters) {
        // filters.categories.booleans['légumes']=false;
        // filters.origins.booleans['France']=true;
        if (articles.hasChanged ||
            filters.categories.hasChanged ||
            filters.origins.hasChanged ||
            filters.search.hasChanged) {

            let filteredValues = articles.values; // TODO

            this.state.filteredArticles.values = filteredValues;
            this.state.filteredArticles.hasChanged = true;
        }
    },

    updateDisplay(display) {
        const cartView = this.state.display.cartView;
        if (cartView.value != display.cartView) {
            cartView.value = display.cartView;
            cartView.hasChanged = true;
        }
        const articlesView = this.state.display.articlesView;
        if (articlesView.value != display.articlesView) {
            articlesView.value = display.articlesView;
            articlesView.hasChanged = true;
        }

    },

    updatePagination(pagination) {
        const statePagination = this.state.pagination;

        const articleGrid = document.getElementById('articleWidth');
        const articleWidth = articleGrid.clientWidth;
        const minCardWidth = 200;
        const articlesView = this.state.display.articlesView.value;
        const maxArticlesPerLine = (articlesView == 'grid') ? Math.floor(articleWidth / minCardWidth) : 1;
        const linesPerPage = pagination[articlesView].linesPerPage;
        const numberOfArticles = this.state.filteredArticles.values.length;
        const numberOfPages = Math.ceil(numberOfArticles / (maxArticlesPerLine * linesPerPage));

        statePagination[articlesView].currentPage = pagination[articlesView].currentPage;
        statePagination[articlesView].linesPerPage = linesPerPage;
        statePagination[articlesView].linesPerPageOptions = pagination[articlesView].linesPerPageOptions;
        statePagination[articlesView].maxArticlesPerLine = maxArticlesPerLine;
        statePagination[articlesView].numberOfPages = numberOfPages;
        statePagination[articlesView].hasPrevPage = pagination[articlesView].currentPage > 1;
        statePagination[articlesView].hasNextPage = pagination[articlesView].currentPage < numberOfPages;

        this.state.display.articlesView.hasChanged = true;
    },

    updateCartSort(cartSort) {
        if (cartSort.hasChanged) {
            this.state.cartSort.property = cartSort.property;
            this.state.cartSort.ascending = cartSort.ascending;
            this.state.cartSort.hasChanged = true;
        }
    },

    /**
     * Remplit le panier avec tous les articles dont inCart == true
     * et calcule le prix total du panier
     */
    updateCart(model) {
        const articles = model.articles;
        if (articles.hasChanged) {

            this.state.cart.values = []; // TODO
            this.state.cart.total = 0; // TODO
            this.state.cart.hasChanged = true;
        }
    },

    // Met à jour l'état de l'application, construit le code HTML correspondant,
    // et demande son affichage.
    samRepresent(model) {

        this.updateFilterUI(model, this.state, 'categories');
        this.updateFilterUI(model, this.state, 'origins');
        this.updateSearchUI(model, this.state);
        this.updateArticlesUI(model, this.state);
        this.updateCartUI(model, this.state);

        //Settings

        const representation = samView.mainUI(model, this.state);

        //Appel l'affichage du HTML généré.
        samView.samDisplay(representation);
    },

    updateFilterUI(model, state, filterName) {
        const filter = state.filters[filterName];
        if (filter.hasChanged) {
            filter.representation = samView.filterUI(model, state, filterName)
            filter.hasChanged = false;
        }
    },

    updateSearchUI(model, state) {
        const filter = state.filters.search;
        if (filter.hasChanged) {
            filter.representation = samView.searchUI(model, state);
            filter.hasChanged = false;
        }
    },

    updateArticlesUI(model, state) {
        const filteredArticles = state.filteredArticles;
        const articlesView = state.display.articlesView;
        if (filteredArticles.hasChanged || articlesView.hasChanged) {
            filteredArticles.representation = articlesView.value == 'grid' ? samView.articlesGridUI(model, state) : samView.articlesListUI(model, state);
            filteredArticles.hasChanged = false;
            articlesView.hasChanged = false;
        }
    },

    updateCartUI(model, state) {
        const cart = state.cart;
        const cartView = state.display.cartView;
        const cartSort = state.cartSort;
        if (cart.hasChanged || cartView.hasChanged || cartSort.hasChanged) {
            cart.representation = samView.cartUI(model, state);
            cart.hasChanged = false;
            cartView.hasChanged = false;
            cartSort.hasChanged = false;
        }
    },

    updateThemeUI(model, state) {
        const settings = state.settings;
        if (settings.darkThemeHasChanged) {
            samView.darkThemeUI(state);
            settings.darkThemeHasChanged = false;
        }
    },

};










//--------------------------------------------------------------------- View ---
// Génération de portions en HTML et affichage
//
samView = {

    // Injecte le HTML dans une balise de la page Web.
    samDisplay: function(representation) {
        const app = document.getElementById('app');
        app.innerHTML = representation;
    },

    // Astuce : Pour avoir la coloration syntaxique du HTML avec l'extension lit-html dans VSCode
    // https://marketplace.visualstudio.com/items?itemName=bierner.lit-html
    // utiliser this.html`<h1>Hello World</h1>` en remplacement de `<h1>Hello World</h1>`
    html([str, ...strs], ...vals) {
        return strs.reduce((acc, v, i) => acc + vals[i] + v, str);
    },

    mainUI(model, state) {

        this.darkThemeUI(model);

        const cartClass = model.display.cartView ? 'border' : '';

        return this.html `
    <div class="row small-margin">
    <!-- ___________________________________________________________ Entête -->
    <div class="row middle-align no-margin">
      <div class="col s8 m9 l10">
        <h4 class="center-align"> Commande de fruits et légumes</h4>
      </div>
      <div class="col s4 m3 l2">
        <nav class="right-align small-margin">
          <button onclick="samActions.exec({do:'viewCartToggle'})" class="no-marin ${cartClass}">
            <i class="large">shopping_basket</i>
          </button>
          <button class="no-margin" data-ui="#dropdown3_">
            <i class="large">account_circle</i>
            <div id="dropdown3_" data-ui="#dropdown3_" class="dropdown left no-wrap">
              <a>Auteurs : <b>${initialModel.authors[0]}</b> et <b>${initialModel.authors[1]}</b></a>
            </div>
          </button>
        </nav>
      </div>
    </div>
    <div class="row">
      <div class="col s3 m2 l2" style="position:sticky; top: 10px;">
        <!-- ______________________________________________________ Filtres -->
      
        <aside>
          <h5>Filtres</h5>
          <h6>Catégories</h6>          
          <div>
            ${state.filters.categories.representation}
          </div>
          <div class="small-space"></div>
          <h6>Origines</h6>
          <div>
            ${state.filters.origins.representation}
          </div>
          <div class="small-space"></div>
          <h6>Recherche</h6>
          ${state.filters.search.representation}
          <div class="small-space"></div>          
          <h5>Paramètres</h5>
          ${this.settingsUI(model,state)}
          
        </aside>

      </div>
      <div class=" col s9 m10 l10">
        <!-- ___________________________________ Récap filtres et recherche -->
        
        
        <div class="row top-align no-margin">
          <nav class="col s8 wrap no-margin">
            ${this.filtersSearchTagsUI(model,state)}
            <!-- ${state.filteredArticles.representation}   -->
          </nav>
          <nav class="col s4 right-align no-margin">
            ${this.articlesViewUI(model,state)}
          </nav>
        </div>
        
        <!-- _____________________________________________________ Articles -->
        
        ${state.filteredArticles.representation}  
      
        <!-- ___________________________________________________ Pagination -->
        ${this.paginationUI(model,state)}
        
        
      </div>
    </div>
  </div>
  <!-- ______________________________________________________________Panier -->
  ${state.cart.representation}
  `;
    },

    darkThemeUI(model) {
        const bodyclass = document.body.classList;
        if (model.settings.darkTheme) bodyclass.add('is-dark');
        else bodyclass.remove('is-dark');
    },

    filterUI(model, state, filterName) {

        console.log('filterUI', filterName)

        // TODO

        return this.html `   
      <div>
        <label class="checkbox">
          <input type="checkbox" checked="checked" />
          <span class="capitalize">toutes</span>  
          <a><span class="badge circle right color-2-text color-2a">0</span></a>
        </label>
      </div>
  
      <div>
        <label class="checkbox">
          <input type="checkbox" checked="checked" />
          <span class="capitalize">${initialModel.origins[0]}</span>  
          <a><span class="badge circle right color-2-text color-2a">0</span></a>
        </label>
      </div>
    `;
    },

    searchUI(model, state) {

        console.log('searchUI')

        // TODO

        return this.html `
      <div class="middle-align small-margin">
        <label class="switch">
          <input type="checkbox" />
          <span>globale</span>
        </label>
      </div>
      <div class="field prefix round fill border small">
        <i>search</i>
        <input type="text" class="align-middle" value="a" /> 
      </div>    
    `;
    },

    settingsUI(model, state) {
        const withImageChecked = model.settings.articleImages ? 'checked="checked"' : '';
        const darkThemeChecked = model.settings.darkTheme ? 'checked="checked"' : '';
        const animationsChecked = model.settings.animations ? 'checked="checked"' : '';

        return this.html `
      <div class="middle-align small-margin">
        <label class="switch">
          <input type="checkbox" onclick="samActions.exec({do:'imagesToggle'})" ${withImageChecked} />
          <span>Articles <br />avec images</span>
        </label>
      </div>
      <div class="middle-align small-margin">
        <label class="switch">
          <input type="checkbox" onclick="samActions.exec({do:'animationsToggle'})" ${animationsChecked} />
          <span>Animations</span>
        </label>
      </div>          
      <div class="middle-align small-margin">
        <label class="switch">
          <input type="checkbox" onclick="samActions.exec({do:'darkThemeToggle'})" ${darkThemeChecked} />
          <span>Thème <br /> sombre</span>
        </label>
      </div>          
          `;
    },

    filtersSearchTagsUI(model, state) {

        console.log('filtersSearchTagsUI')

        // TODO

        return this.html `           
      <label  class="medium-text color-2-text">7 articles -</label>

      <span class="chip small no-margin capitalize ">
        fruits<i class="small">close</i>
      </span>  

      <span class="chip small no-margin capitalize ">
        France<i class="small">close</i>
      </span>          

      <span class="chip small no-margin">
        Rech : "a"<i class="small">close</i>
      </span>              
    `;
    },

    articlesViewUI(model, state) {

        const gridOn = state.display.articlesView.value == 'grid';
        const gridViewClass = gridOn ? 'disabled' : '';
        const gridViewDisabled = gridOn ? 'disabled="disabled"' : '';
        const listViewClass = gridOn ? '' : 'disabled';
        const listViewDisabled = gridOn ? '' : 'disabled="disabled"';

        return this.html `
      <button onclick="samActions.exec({do:'gridListView', view:'list'})" class="small no-margin ${listViewClass}" ${listViewDisabled}>
        <i>view_list</i></button>
      <button onclick="samActions.exec({do:'gridListView', view:'grid'})" class="small           ${gridViewClass}" ${gridViewDisabled}>
        <i>grid_view</i></button>
    `;
    },

    inEuro(number) {
        const numString = (number + 0.0001) + '';
        const dotIndex = numString.indexOf('.');
        return numString.substring(0, dotIndex + 3) + ' €';
    },

    articlesGridUI(model, state) {

        console.log('articlesGridUI');

        // TODO

        return this.html `
      <article class="small-margin grid-view">
        
        <div  class="card no-padding small-margin">            
          <div class="card-image center-align">
            <img src="./images/avocat.jpg" />
          </div>            
          <div class="small-padding">
            <h6 class="no-margin">Avocats</h6>
            <div class="small-margin"><label>Origine : </label>Pérou</div>
            <div class="chip large">
              <label>Prix: </label><span class="large-text">1.50 € / <span class="avoidwrap">Pièce</span> </span>
            </div>
            <div class="row no-margin">
              <div class="col s8 field round fill border center-align">
                <input type="text" class="center-align color-1a" value="" />
                <label>Quantité</label>
              </div>
              <div class=" col s4">
                <button class="circle no-margin disabled" disabled="disabled">
                  <i>add</i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      
        <div  class="card no-padding small-margin">       
          <div class="card-image center-align">
            <img src="./images/fraises.jpg" />
          </div>            
          <div class="small-padding">
            <h6 class="no-margin">Fraises</h6>
            <div class="small-margin"><label>Origine : </label>France</div>
            <div class="chip large">
              <label>Prix: </label><span class="large-text">3.00 € / <span class="avoidwrap">Barquette 250g</span> </span>
            </div>
            <div class="row no-margin">
              <div class="col s8 field round fill border center-align">
                <input type="text" class="center-align color-1a" value="2" />
                <label>Quantité</label>
              </div>
              <div class=" col s4">
                <button class="circle no-margin ">
                  <i>add</i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      
        <div  class="card no-padding small-margin">        
          <div class="card-image center-align">
            <img src="./images/fraises.jpg" />
          </div>            
          <div class="small-padding">
            <h6 class="no-margin">Fraises</h6>
            <div class="small-margin"><label>Origine : </label>France</div>
            <div class="chip large">
              <label>Prix: </label><span class="large-text">5.00 € / <span class="avoidwrap">Barquette 500g</span> </span>
            </div>
            <div class="row no-margin">
              <div class="col s8 field round fill border center-align">
                <input type="text" class="center-align " value="3" />
                <label>Quantité</label>
              </div>
              <div class=" col s4">
                <button class="circle no-margin ">
                  <i>edit</i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </article>
    `;
    },

    articlesListUI(model, state) {

        console.log('articlesListUI');

        // TODO

        return this.html `
      <article class="large-margin list-view">
      
        <nav  class="row card divider no-wrap">            
          <div class="col min">
            <img src="./images/avocat.jpg" class="circle tiny" />
          </div>
          <div class="col">
            <h6>Avocats</h6>
            <label>Pérou</label>
          </div>
          <div class="col min chip no-margin">
            <label>Prix : </label><span class="large-text">1.50 € / Pièce</span>
          </div>
          <div class="col min field round fill small border center-align no-margin">
            <label>Qté : </label>
            <input type="text" value="" class="center-align color-1a" />
          </div>
          <div class="col min no-margin"></div>
          <div class="col min">
            <button class="circle no-margin disabled" disabled="disabled">
              <i>add</i>
            </button>
          </div>
        </nav>
  
        <nav  class="row card divider no-wrap">          
          <div class="col min">
            <img src="./images/fraises.jpg" class="circle tiny" />
          </div>
          <div class="col">
            <h6>Fraises</h6>
            <label>France</label>
          </div>
          <div class="col min chip no-margin">
            <label>Prix : </label><span class="large-text">3.00 € / Barquette 250g</span>
          </div>
          <div class="col min field round fill small border center-align no-margin">
            <label>Qté : </label>
            <input type="text" class="center-align color-1a" />
          </div>
          <div class="col min no-margin"></div>
          <div class="col min">
            <button class="circle no-margin ">
              <i>add</i>
            </button>
          </div>
        </nav>         
  
        <nav  class="row card divider no-wrap">
          <div class="col min">
            <img src="./images/fraises.jpg" class="circle tiny" />
           </div>      
          <div class="col">
            <h6>Fraises</h6>
            <label>France</label>
          </div>
          <div class="col min chip no-margin">
            <label>Prix : </label><span class="large-text">5.00 € / Barquette 500g</span>
          </div>
          <div class="col min field round fill small border center-align no-margin">
            <label>Qté : </label>
            <input type="text" value="3" class="center-align " />
          </div>
          <div class="col min no-margin"></div>
          <div class="col min">
            <button class="circle no-margin ">
              <i>edit</i>
            </button>
          </div>
        </nav>
          
      </article>
    `;
    },

    articlesEmptyUI(model, state) {

        return this.html `
      <div class="row">
        <div class="col s12 medium-padding fond">
          <img src="./images/fond.png" class="responsive" />
        </div>
      </div>
    `;
    },

    paginationUI(model, state) {

        console.log('paginationUI');

        // TODO

        return this.html `
      <nav class="center-align">
        <button class="square border disabled" disabled="disabled">
          <i>navigate_before</i>
        </button>     
        <button class="square no-margin border">1</button>      
        <button class="square no-margin ">2</button>      
        <button class="square no-margin ">3</button>      
        <button class="square ">
          <i>navigate_next</i>
        </button>
        <div class="field suffix small">
          <select>
            <option value="1" selected="selected">1 ligne par page</option>
            <option value="2">2 lignes par page</option>
            <option value="3">3 lignes par page</option>
          </select>
          <i>arrow_drop_down</i>
        </div>
      </nav>
    `;
    },

    cartUI(model, state) {

        console.log('cartUI')

        if (!model.display.cartView) return '';

        // TODO

        return this.html `
      <div class="panier row small-margin">
    <div class="col s0 m1 l2"></div>
    <section class="col s12 m10 l8">
      <div class="card ">
        <h4>Panier</h4>
        <div>
          <table border="0" class="right-align large-text">
            <thead>
              <th class="center-align"><a>
                Articles <i class="small">unfold_more</i></a></th>
              <th class="center-align"><a>
                Qté<i class="small">unfold_more</i></a></th>
              <th class="center-align">Unit</th>
              <th class="center-align">P.U.</th>
              <th class="center-align"><a>
                Prix<i class="small">unfold_more</i></a></th>
              <th>
              </th>
            </thead>
            <tr class="ligne-paire">
              <td class="left-align">Fraises</td>
              <td class="quantite">
                <div class="field fill small">
                  <input type="text" class="right-align" value="3" />
                </div>
              </td>
              <td class="left-align">Barquette 500g</td>
              <td>5.00 €</td>
              <td>15.00 €</td>
              <td class="center-align">
                <label class="checkbox">
                  <input type="checkbox" checked="checked"/>
                  <span></span>
                </label>
              </td>
            </tr>
            <tfoot class="orange-light-3">
              <th colspan="4">Total :</th>
              <th>26.75 €</th>
              <th class="center-align">
                <button type="button" onclick="samActions.exec({do:'cartDelete'})" 
                  class="small"><i>delete</i></button>
              </th>
            </tfoot>
          </table>
        </div>
        <div class="medium-margin right-align">
          <button 
            onclick="envoyerCommande('${initialModel.authors[0]} et ${initialModel.authors[1]}', samState.state.cart.values, ${state.cart.total})"><i class="small-margin">send</i> Envoyer la commande</button>
        </div>
      </div>
    </section>
  </div>

    `;

    },

};

function envoyerCommande(client, articles, total) {

    // TODO

    let email = 'commandes@fruits-legumes.com';
    let sujet = 'Commande de ' + client;
    let corps = `
Commande de fruits et légumes

Voici les articles commandés pour un montant de ${samView.inEuro(total)} :

- Fraises (3 Barquette 500g)
- Fraises (1 Plateau 1kg)
- Oranges (2.5 kg)
  
  `;
    email = encodeURIComponent(email);
    sujet = encodeURIComponent(sujet);
    corps = encodeURIComponent(corps);
    const uri = "mailto:" + email + "?subject=" + sujet + "&body=" + corps;
    window.open(uri);
}