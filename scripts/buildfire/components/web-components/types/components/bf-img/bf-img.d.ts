import '../../stencil.core';
export declare class Img {
    realSrc: string;
    suffix: string;
    filterDefault: string;
    operations: {
        cdn: string;
        cdno: string;
        width: string;
        height: string;
        crop: string;
    };
    defaultOperation: string;
    token: string;
    url: string;
    operation: string;
    quality: number;
    width: string;
    height: string;
    getOperation(): string;
    getSize(): string;
    buildUrl(): string;
    componentWillUpdate(): void;
    componentDidLoad(): void;
    render(): JSX.Element;
}
