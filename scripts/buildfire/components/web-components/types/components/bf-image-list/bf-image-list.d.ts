import '../../stencil.core';
import { EventEmitter } from '../../stencil.core';
export declare class ImageList {
    token: string;
    images: string[];
    width: number;
    height: number;
    listImageWidth: number;
    listImageHeight: number;
    imageCount: number;
    selectedImages: any[];
    componentWillLoad(): void;
    componentDidLoad(): void;
    calculateWidth(): void;
    imageSelected: EventEmitter;
    setItemCount(): void;
    selectImage(selectedImage: string, event: any): void;
    render(): JSX.Element[];
}
