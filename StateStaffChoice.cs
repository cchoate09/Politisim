using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class StateStaffChoice : MonoBehaviour
{
    public TextMeshProUGUI stateStaff;
    public TextMeshProUGUI commsStaff;
    public TextMeshProUGUI fundraisingStaff;
    public List<string> lines;
    public TextAsset txt;
    public TMP_Dropdown m_dropdown;
    public List<string> stateNames;
    public Dictionary<string, string> stateStaffData = new Dictionary<string, string>();
    public string[] dataArr = new string[3];


    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        for (int i = 0; i < lines.Count; i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            stateNames.Add(l[0]);
            if (!stateStaffData.ContainsKey(l[0]))
            {
                dataArr[0] = stateStaff.text;
                dataArr[1] = commsStaff.text;
                dataArr[2] = fundraisingStaff.text;
                stateStaffData[l[0]] = string.Join('\n', dataArr);
            }
        }
        m_dropdown = gameObject.GetComponent<TMP_Dropdown>();
        m_dropdown.AddOptions(stateNames);
        m_dropdown.onValueChanged.AddListener(delegate {DropdownValueChanged(m_dropdown);});
        if (stateStaffData.ContainsKey(m_dropdown.options[m_dropdown.value].text))
        {
            var anArray = stateStaffData[m_dropdown.options[m_dropdown.value].text].Split('\n');
            stateStaff.text = anArray[0];
            commsStaff.text = anArray[1];
            fundraisingStaff.text = anArray[2];
        }
    }

    // Update is called once per frame
    void Update()
    {
        string sName = gameObject.GetComponentInChildren<TextMeshProUGUI>().text;
        dataArr[0] = stateStaff.text;
        dataArr[1] = commsStaff.text;
        dataArr[2] = fundraisingStaff.text;
        stateStaffData[sName] = string.Join('\n', dataArr);
    }

    public void DropdownValueChanged(TMP_Dropdown change)
    {
        if (stateStaffData.ContainsKey(change.options[change.value].text))
        {
            var anArray = stateStaffData[change.options[change.value].text].Split('\n');
            stateStaff.text = anArray[0];
            commsStaff.text = anArray[1];
            fundraisingStaff.text = anArray[2];
        }
        else
        {
            stateStaff.text = "0";
            commsStaff.text = "0";
            fundraisingStaff.text = "0";
        }
    }
}
