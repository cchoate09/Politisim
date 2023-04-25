using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using System;

public class SetCampaignPositions : MonoBehaviour
{

    //public CampaignLoad campaignIssues;
    //public List<string> textLines;
    //public float lowApproval = 35f;
    //public float highApproval = 65f;
    public GameObject toggleParent;
    //public int globalParms = 6;

    // Start is called before the first frame update
    void Start()
    {
        Button button = GetComponent<Button>();
        button.onClick.AddListener(OnButtonClick);
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void OnButtonClick()
    {

        // float initialApproval = UnityEngine.Random.Range(lowApproval, highApproval);
        // // Access the integer array from the other object
        // int[] integerArray = campaignIssues.values;
        // List<string> textLines = campaignIssues.lines;
        // Toggle[] toggles = toggleParent.GetComponentsInChildren<Toggle>();
        // bool[] toggleValues = new bool[toggles.Length];

        // float value1 = PlayerPrefs.GetFloat("Liberal");
        // float value2 = PlayerPrefs.GetFloat("Libertarian");
        // float value3 = PlayerPrefs.GetFloat("Owners");
        // float value4 = PlayerPrefs.GetFloat("Immigrants");
        // float value5 = PlayerPrefs.GetFloat("Religious");
        // float value6 = PlayerPrefs.GetFloat("Workers");

        // float[] percentages = {value1, value2, value3, value4, value5, value6};

        // for (int i = 0; i < toggles.Length; i++)
        // {
        //     toggleValues[i] = toggles[i].isOn;
        // }

        // // Loop through the values in the array
        // for (int i = 0; i < integerArray.Length; i++)
        // {
        //     Debug.Log(integerArray[i]);
        //     List<string> newLine = new List<string>(textLines[integerArray[i]].Split('\t').ToList());
        //     Debug.Log(newLine[2]);
        //     if (toggleValues[i])
        //     {
        //         float modifier = 0;
        //         for (int j = 0; j < globalParms; j++)
        //         {
        //             modifier += (percentages[j]/100f) * (float.Parse(newLine[j+2])/100f);
        //         }
        //         initialApproval += modifier;
        //     }
        // }

        // PlayerPrefs.SetFloat("ApprovalRating", initialApproval);

        toggleParent.SetActive(false);
        gameObject.SetActive(false);

    }

    


}
