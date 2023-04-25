using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;


public class AdResetButton : MonoBehaviour
{
    public Button myButton;
    public StateChoice sc;
    public string[] resetArr = new string[3];
    // Start is called before the first frame update
    void Start()
    {
        myButton.onClick.AddListener(onButtonClick);
    }

    void onButtonClick()
    {
        var arrayOfAllKeys = sc.stateData.Keys.ToArray();
        foreach(string line in arrayOfAllKeys)
        {
            resetArr[0] = "0";
            resetArr[1] = "0";
            resetArr[2] = "0";
            sc.stateData[line] = string.Join('\n', resetArr);
        }
        sc.internetAds.value = 0f;
        sc.TVAds.value = 0f;
        sc.Mailers.value = 0f;
        sc.DropdownValueChanged(sc.m_dropdown);

    }
}
