using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class GeneralElectionStateVisits : MonoBehaviour
{

    public List<string> lines;
    public TextAsset txt;
    public TMP_Dropdown m_dropdown;
    public Dictionary<string, string> stateVisits = new Dictionary<string, string>();
    public TextMeshProUGUI stateVisit;
    public TextMeshProUGUI fundVisit;
    public string[] dataArr = new string[2];
    public List<string> stateNames;

    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        for (int i = 0; i < lines.Count; i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            stateNames.Add(l[0]);
            if (!stateVisits.ContainsKey(l[0]))
            {
                dataArr[0] = stateVisit.text;
                dataArr[1] = fundVisit.text;
                stateVisits[l[0]] = string.Join('\n', dataArr);
            }
        }
        m_dropdown = gameObject.GetComponent<TMP_Dropdown>();
        m_dropdown.AddOptions(stateNames);
        m_dropdown.onValueChanged.AddListener(delegate {DropdownValueChanged(m_dropdown);});
    }

    // Update is called once per frame
    void Update()
    {
        string sName = gameObject.GetComponentInChildren<TextMeshProUGUI>().text;
        dataArr[0] = stateVisit.text;
        dataArr[1] = fundVisit.text;
        stateVisits[sName] = string.Join('\n', dataArr);
    }

    void DropdownValueChanged(TMP_Dropdown change)
    {
        if (stateVisits.ContainsKey(change.options[change.value].text))
        {
            var anArray = stateVisits[change.options[change.value].text].Split('\n');
            stateVisit.text = anArray[0];
            fundVisit.text = anArray[1];
        }
        else
        {
            stateVisit.text = "0";
            fundVisit.text = "0";
        }
    }

}
