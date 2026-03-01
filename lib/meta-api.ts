import axios from "axios";

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

export interface MetaLeadFieldData {
    name: string;
    values: string[];
}

export interface MetaLeadData {
    created_time: string;
    id: string;
    ad_id?: string;
    form_id?: string;
    field_data: MetaLeadFieldData[];
}

/**
 * Fetches the lead details from Meta Graph API
 */
export async function getMetaLeadDetails(leadgenId: string): Promise<MetaLeadData | null> {
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
        console.error("META_ACCESS_TOKEN is not configured.");
        return null;
    }

    try {
        const response = await axios.get(`${META_GRAPH_URL}/${leadgenId}`, {
            params: {
                access_token: accessToken,
                fields: "created_time,id,ad_id,form_id,field_data",
            },
        });

        return response.data as MetaLeadData;
    } catch (error: any) {
        console.error(
            `Failed to fetch Meta lead details for leadgen_id ${leadgenId}:`,
            error.response?.data || error.message
        );
        return null;
    }
}
