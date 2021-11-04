
import { IDocument, ISelectedFolder, ResponseItemType } from "../interfaces/documents/document.interfaces";
import { MapDriveItemToDocument } from "../shared/mappers/driveitem-document.mapper";
import {client} from "../shared/ms-graph/ms-graph-factory";
import { _copyAndSort } from "../shared/utilities/copy-sort";

export async function  getFlowsheetListItemsAsync(selectedFolder:ISelectedFolder, siteId:string,flowsheetsListId:string) {
    try {   
        const selectedFolderPath = selectedFolder.webUrl.split('/').slice(1).reduce((prev, curr) => prev + "/" + curr, "");

        let apidrivePath = `/sites/${siteId}/lists/${flowsheetsListId}/drive/root:/${selectedFolderPath}:/children`;

       
        console.log("get drive items apiPath:", apidrivePath);
        let driveItems = [];

        let driveItemsResp = await client.api(apidrivePath).expand("listItem($expand=fields)").get();
        driveItems.push(...driveItemsResp.value);
        while (driveItemsResp["@odata.nextLink"]) {
            driveItemsResp = await client.api(driveItemsResp["@odata.nextLink"]).get();
            driveItems.push(...driveItemsResp.value);
        }
        console.log("Drive items:", driveItems);

        let documents: IDocument[] = [];      
     
            documents = driveItems.map(driveItem => MapDriveItemToDocument(driveItem));
        //remove hide from dashboard files
        documents = documents.filter(document => document.hideFromDashboard === false);

        const files = documents.filter((document) => document.fileType === ResponseItemType.File && !!document.extension
         && (document.extension=="dwxmz"|| document.extension=="dwxml"));
        const folders = documents.filter((document) => document.fileType === ResponseItemType.Folder);

        let sortedFolders = _copyAndSort<IDocument>(folders, "name", false);
        let sortedFiles = _copyAndSort<IDocument>(files, "name", false);

        const filesAndFolders = { files: sortedFiles, folders: sortedFolders };
        console.log("getSharedFlowsheetsItems results:", filesAndFolders);   
        return filesAndFolders;

    } catch (error) {
        console.log("Error while getting List items:", error);        
    }

}
