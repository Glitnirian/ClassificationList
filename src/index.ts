export interface ClassificationClassesObject<ElementType> {
    [className: string]: ElementType[] | ElementType
}

export type ClassificationMappingMethod<ElementType> = (element: ElementType) => string | string[] | undefined;

export interface CustomClassification<ElementType> {
    mappingMethod: ClassificationMappingMethod<ElementType>,
    classes: ClassificationClassesObject<ElementType>
    mono?: boolean // mono mean the mapping will be key / element direct. Unique like with a unique name
}

/**
 *
 *
 * @export
 * @class ClassificationList
 * @template ElementType
 */
export class ClassificationList<ElementType> {
    private _list: ElementType[];
    private _mainClassing: { [id: string]: ElementType } = {};
    private _customClassifications: { [classificationName: string]: CustomClassification<ElementType> } = {};

    constructor(list: ElementType[], useMainClassing = true) {
        this._list = list;
        if (useMainClassing) {
            this.initMainClassing();
        }
    }

    public getList() {
        return this._list;
    }

    /**
     *  Main classing
     *
     * - the elements should be objects
     * - & with an id property that identify it uniquely
     * [otherwise overriding will happen]
     * (may be we will allow to precise a different identifying property name, for flexibility)
     *
     * it will map the elements by using there id property
     */
    public initMainClassing() {
        if (this._list[0] && (this._list[0] as any).id) {
            this._mainClassing = {};
            for (const element of this._list) {
                this._mainClassing[(element as any).id] = element; // [to do] you can add the id member
            }
        }

        return this;
    }

    public addCustomClassification(
        classificationName: string,
        mappingMethod: ClassificationMappingMethod<ElementType>,
        mono = false,
        init = false
    ) {
        this._customClassifications[classificationName] = {
            classes: {},
            mappingMethod,
            mono
        };

        if (init) {
            this.initCustomClassification(classificationName);
        }

        return this;
    }

    public initCustomClassification(classificationName: string) {
        if (this._customClassifications[classificationName]) {
            for (const element of this._list) {
               this._pushToCustomClass(classificationName, element);
            }
        }
        return this;
    }

    public initAllCustomClassifications() {
        for (const classificationName of Object.keys(this._customClassifications)) {
            this.initCustomClassification(classificationName);
        }

        return this;
    }

    public mainClsGet(id: string) {
        return this._mainClassing[id];
    }

    public customClsGet(classificationName: string, className: string): ElementType[] | ElementType | undefined {
        if (this._customClassifications[classificationName]) {
            return this._customClassifications[classificationName].classes[className];
        }
        return undefined;
    }

    public getCustomClassification(classificationName: string): CustomClassification<ElementType> {
        return this._customClassifications[classificationName];
    }

    public getCustomClassificationClassesNames(classificationName: string): string[] | undefined {
        if (
            this._customClassifications[classificationName]
            && this._customClassifications[classificationName].classes
        ) {
            return Object.keys(
                this._customClassifications[classificationName].classes
            )
            .filter(
                (className) => !!this._customClassifications[classificationName].classes[className]
            );
        }
        return undefined;
    }

    public push(element: ElementType) {
        this._list.push(element);
        this._pushToMainClassing(element);

        const classificationsNames = Object.keys(this._customClassifications);
        // [to do] see if you need to maintain an object for the keys of the classifications
        const classificationsNamesLength = classificationsNames.length;
        let i = 0;
        let classificationName;
        for (; i < classificationsNamesLength; i++) {
            classificationName = classificationsNames[i];

            this._pushToCustomClass(classificationName, element);
        }
        return this;
    }

    private _pushToMainClassing(element: ElementType) {
        if (element && (element as any).id) {
            this._mainClassing[(element as any).id] = element;
        }
    }

    /**
     * not safe (classificationName may not exists) [you need to check before use] [for performance reasons]
     *
     * @private
     * @param {string} classificationName
     * @param {ElementType} element
     * @memberof ClassificationList
     */
    private _pushToCustomClass(classificationName: string, element: ElementType) {
        const className = this._customClassifications[classificationName].mappingMethod.call(this, element);

        if (className) {
            if (Array.isArray(className)) {
                for (const name of className) {
                    this._pushToCustomClass_oneClassName(classificationName, name, element);
                }
            } else {
                this._pushToCustomClass_oneClassName(classificationName, className, element);
            }
        }
    }

    private _pushToCustomClass_oneClassName(classificationName: string, className: string, element: ElementType) {
        const classification = this._customClassifications[classificationName];

        if (classification.mono) {
            classification.classes[className] = element;
        } else if (Array.isArray(this._customClassifications[classificationName].classes[className])) {
                (classification.classes[className] as ElementType[]).push(element);
                // here add indexes to the mainClassing [to do] [for easy delete too, and better indexing]
            } else {
                classification.classes[className] = [element];
                // here add indexes to the mainClassing [to do] [for easy delete too, and better indexing]
            }
    }
}

/**
 *  consider using Tree data structure and algorithms, or indexes algorithms
 *  (investigate it)
 */
