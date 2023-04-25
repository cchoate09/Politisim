using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class StaffResetButton : MonoBehaviour
{
    public Button myButton;
    public StateStaffChoice ssc;
    public string[] resetArr = new string[3];

    // Start is called before the first frame update
    void Start()
    {
        myButton.onClick.AddListener(onButtonClick);
    }

    void onButtonClick()
    {
        var arrayOfAllKeys = ssc.stateStaffData.Keys.ToArray();
        foreach(string line in arrayOfAllKeys)
        {
            resetArr[0] = "0";
            resetArr[1] = "0";
            resetArr[2] = "0";
            ssc.stateStaffData[line] = string.Join('\n', resetArr);
        }
        ssc.stateStaff.text = "0";
        ssc.commsStaff.text = "0";
        ssc.fundraisingStaff.text = "0";
        //ssc.DropdownValueChanged(ssc.m_dropdown);
    }
}
